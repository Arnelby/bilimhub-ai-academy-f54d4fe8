-- 1. Расширяем CHECK ограничения, чтобы фазы lesson/validation корректно сохранялись
ALTER TABLE public.user_learning_state
  DROP CONSTRAINT IF EXISTS user_learning_state_current_step_check;
ALTER TABLE public.user_learning_state
  ADD CONSTRAINT user_learning_state_current_step_check
  CHECK (current_step = ANY (ARRAY['test','practice','review','done','lesson','validation','idle','repeat']));

ALTER TABLE public.user_learning_state
  DROP CONSTRAINT IF EXISTS user_learning_state_next_action_check;
ALTER TABLE public.user_learning_state
  ADD CONSTRAINT user_learning_state_next_action_check
  CHECK (next_action = ANY (ARRAY['test','practice','review_errors','completed','lesson','validation','watch_lesson','repeat']));

-- 2. Перерасчёт плана теперь фильтрует weak topics: только те, у которых есть урок в lessons.
CREATE OR REPLACE FUNCTION public.recompute_learning_state(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_topic_stats jsonb := '{}'::jsonb;
  v_recent_by_topic jsonb := '{}'::jsonb;
  v_weak_topics jsonb := '[]'::jsonb;
  v_strong_topics jsonb := '[]'::jsonb;
  v_phase text;
  v_phase_topic text;
  v_phase_streak int;
  v_next_action text;
  v_next_reason text;
BEGIN
  -- Aggregate per-topic stats (last 90 days)
  WITH unified AS (
    SELECT topic, is_correct, created_at
      FROM public.practice_responses
      WHERE user_id = _user_id AND topic IS NOT NULL
        AND created_at > now() - interval '90 days'
    UNION ALL
    SELECT topic, is_correct, created_at
      FROM public.question_attempts
      WHERE user_id = _user_id AND topic IS NOT NULL
        AND created_at > now() - interval '90 days'
  ),
  per_topic AS (
    SELECT
      topic,
      count(*)::int AS total_attempts,
      sum(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct_answers
    FROM unified
    GROUP BY topic
  )
  SELECT COALESCE(
    jsonb_object_agg(
      topic,
      jsonb_build_object(
        'total_attempts', total_attempts,
        'correct_answers', correct_answers,
        'accuracy', CASE WHEN total_attempts > 0
                         THEN round((correct_answers::numeric / total_attempts) * 100) / 100
                         ELSE 0 END
      )
    ),
    '{}'::jsonb
  )
  INTO v_topic_stats
  FROM per_topic;

  -- Last 15 attempts per topic
  WITH unified AS (
    SELECT topic, is_correct, created_at
      FROM public.practice_responses
      WHERE user_id = _user_id AND topic IS NOT NULL
    UNION ALL
    SELECT topic, is_correct, created_at
      FROM public.question_attempts
      WHERE user_id = _user_id AND topic IS NOT NULL
  ),
  ranked AS (
    SELECT topic, is_correct,
      row_number() OVER (PARTITION BY topic ORDER BY created_at DESC) AS rn
    FROM unified
  ),
  last15 AS (
    SELECT topic, is_correct
    FROM ranked
    WHERE rn <= 15
    ORDER BY topic, rn DESC
  )
  SELECT COALESCE(jsonb_object_agg(topic, arr), '{}'::jsonb)
  INTO v_recent_by_topic
  FROM (
    SELECT topic, jsonb_agg(is_correct) AS arr
    FROM last15
    GROUP BY topic
  ) t;

  -- Список тем, для которых ЕСТЬ урок (источник истины — lessons + topics)
  -- weak: accuracy<0.6, attempts>=3 И тема имеет урок ИЛИ совпадает с title урока
  WITH topics_with_lessons AS (
    SELECT DISTINCT t.title AS topic_title
    FROM public.lessons l
    JOIN public.topics t ON t.id = l.topic_id
    UNION
    SELECT DISTINCT l.title AS topic_title
    FROM public.lessons l
  )
  SELECT COALESCE(jsonb_agg(topic ORDER BY accuracy ASC, total_attempts DESC), '[]'::jsonb)
  INTO v_weak_topics
  FROM (
    SELECT
      key AS topic,
      (value->>'accuracy')::numeric AS accuracy,
      (value->>'total_attempts')::int AS total_attempts
    FROM jsonb_each(v_topic_stats)
    WHERE (value->>'total_attempts')::int >= 3
      AND (value->>'accuracy')::numeric < 0.6
      AND key IN (SELECT topic_title FROM topics_with_lessons)
  ) w;

  -- Strong topics
  SELECT COALESCE(jsonb_agg(topic), '[]'::jsonb)
  INTO v_strong_topics
  FROM (
    SELECT key AS topic
    FROM jsonb_each(v_recent_by_topic)
    WHERE jsonb_array_length(value) >= 5
      AND (
        SELECT count(*) FROM jsonb_array_elements(value) e WHERE (e)::text::boolean
      )::numeric / jsonb_array_length(value) >= 0.8
  ) s;

  -- Read existing phase
  SELECT mastery_phase, phase_topic, phase_correct_streak
    INTO v_phase, v_phase_topic, v_phase_streak
  FROM public.user_learning_state
  WHERE user_id = _user_id;

  IF v_phase IS NULL THEN
    v_phase := 'idle';
    v_phase_streak := 0;
  END IF;

  -- Если текущая тема стала сильной или больше нет в weak (нет урока) → сброс
  IF v_phase_topic IS NOT NULL
     AND (v_strong_topics ? v_phase_topic OR NOT (v_weak_topics ? v_phase_topic)) THEN
    v_phase := 'idle';
    v_phase_topic := NULL;
    v_phase_streak := 0;
  END IF;

  -- Если idle и есть слабые → начинаем с урока
  IF v_phase = 'idle' AND jsonb_array_length(v_weak_topics) > 0 THEN
    v_phase := 'lesson';
    v_phase_topic := v_weak_topics->>0;
    v_phase_streak := 0;
  END IF;

  -- next_action маппится в разрешённые значения CHECK
  IF v_phase = 'idle' THEN
    v_next_action := 'completed';
    v_next_reason := 'Все слабые темы закрыты. Отличная работа!';
  ELSIF v_phase = 'lesson' THEN
    v_next_action := 'lesson';
    v_next_reason := format('Сначала разбери тему: %s', v_phase_topic);
  ELSIF v_phase = 'practice' THEN
    v_next_action := 'practice';
    v_next_reason := format('Закрепи тему практикой: %s', v_phase_topic);
  ELSIF v_phase = 'validation' THEN
    v_next_action := 'validation';
    v_next_reason := format('Проверка темы: %s', v_phase_topic);
  END IF;

  INSERT INTO public.user_learning_state (
    user_id, topic_stats, weak_topics, strong_topics,
    mastery_phase, phase_topic, phase_correct_streak,
    recent_attempts_by_topic, next_action, next_reason,
    current_step, updated_at
  ) VALUES (
    _user_id, v_topic_stats, v_weak_topics, v_strong_topics,
    v_phase, v_phase_topic, v_phase_streak,
    v_recent_by_topic, v_next_action, v_next_reason,
    v_phase, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    topic_stats = EXCLUDED.topic_stats,
    weak_topics = EXCLUDED.weak_topics,
    strong_topics = EXCLUDED.strong_topics,
    mastery_phase = EXCLUDED.mastery_phase,
    phase_topic = EXCLUDED.phase_topic,
    phase_correct_streak = EXCLUDED.phase_correct_streak,
    recent_attempts_by_topic = EXCLUDED.recent_attempts_by_topic,
    next_action = EXCLUDED.next_action,
    next_reason = EXCLUDED.next_reason,
    current_step = EXCLUDED.current_step,
    updated_at = now();

  RETURN jsonb_build_object(
    'mastery_phase', v_phase,
    'phase_topic', v_phase_topic,
    'weak_topics', v_weak_topics,
    'next_action', v_next_action,
    'next_reason', v_next_reason
  );
END;
$function$;