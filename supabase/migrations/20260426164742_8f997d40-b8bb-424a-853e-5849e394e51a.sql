-- 1. Расширить user_learning_state
ALTER TABLE public.user_learning_state
  ADD COLUMN IF NOT EXISTS mastery_phase text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS phase_topic text,
  ADD COLUMN IF NOT EXISTS phase_correct_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phase_attempts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recent_attempts_by_topic jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Допустимые значения mastery_phase: idle | lesson | practice | validation
ALTER TABLE public.user_learning_state
  DROP CONSTRAINT IF EXISTS user_learning_state_mastery_phase_check;
ALTER TABLE public.user_learning_state
  ADD CONSTRAINT user_learning_state_mastery_phase_check
  CHECK (mastery_phase IN ('idle','lesson','practice','validation'));

-- 2. Функция пересчёта состояния обучения
CREATE OR REPLACE FUNCTION public.recompute_learning_state(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  r record;
BEGIN
  -- Aggregate per-topic stats from practice_responses + question_attempts (last 90 days)
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

  -- Last 15 attempts per topic (booleans, oldest→newest)
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
    SELECT
      topic, is_correct,
      row_number() OVER (PARTITION BY topic ORDER BY created_at DESC) AS rn
    FROM unified
  ),
  last15 AS (
    SELECT topic, is_correct
    FROM ranked
    WHERE rn <= 15
    ORDER BY topic, rn DESC
  )
  SELECT COALESCE(
    jsonb_object_agg(topic, arr),
    '{}'::jsonb
  )
  INTO v_recent_by_topic
  FROM (
    SELECT topic, jsonb_agg(is_correct) AS arr
    FROM last15
    GROUP BY topic
  ) t;

  -- Weak topics: accuracy < 0.6 with >= 3 attempts, sorted by accuracy ASC
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
  ) w;

  -- Strong topics: mastered (last 15 ≥80% AND last 5 all correct)
  SELECT COALESCE(jsonb_agg(topic), '[]'::jsonb)
  INTO v_strong_topics
  FROM (
    SELECT key AS topic
    FROM jsonb_each(v_recent_by_topic)
    WHERE jsonb_array_length(value) >= 5
      AND (
        SELECT count(*) FROM jsonb_array_elements(value) e WHERE (e)::text::boolean
      )::numeric / jsonb_array_length(value) >= 0.8
      AND (
        -- last 5 all correct (last 5 elements of array)
        SELECT bool_and((e)::text::boolean)
        FROM (
          SELECT e FROM jsonb_array_elements(value) WITH ORDINALITY AS x(e, ord)
          ORDER BY ord DESC LIMIT 5
        ) lst
      ) = true
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

  -- If current phase_topic became strong → clear phase
  IF v_phase_topic IS NOT NULL
     AND v_strong_topics ? v_phase_topic THEN
    v_phase := 'idle';
    v_phase_topic := NULL;
    v_phase_streak := 0;
  END IF;

  -- If idle and there are weak topics → start lesson on weakest
  IF v_phase = 'idle' AND jsonb_array_length(v_weak_topics) > 0 THEN
    v_phase := 'lesson';
    v_phase_topic := v_weak_topics->>0;
    v_phase_streak := 0;
  END IF;

  -- Compute next_action label
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

  -- Upsert state
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
$$;

-- 3. Функция продвижения фазы — вызывается клиентом после каждого ответа в mastery/validation режимах
CREATE OR REPLACE FUNCTION public.advance_mastery_phase(
  _user_id uuid,
  _topic text,
  _is_correct boolean,
  _is_validation boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phase text;
  v_phase_topic text;
  v_streak int;
  v_attempts jsonb;
  v_new_phase text;
  v_new_topic text;
  v_new_streak int;
  v_correct_in_validation int;
  v_total_in_validation int;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT mastery_phase, phase_topic, phase_correct_streak, phase_attempts
    INTO v_phase, v_phase_topic, v_streak, v_attempts
  FROM public.user_learning_state
  WHERE user_id = _user_id;

  -- Only act if user is working on the matching topic
  IF v_phase_topic IS DISTINCT FROM _topic THEN
    RETURN jsonb_build_object('changed', false, 'reason', 'topic_mismatch');
  END IF;

  v_new_phase := v_phase;
  v_new_topic := v_phase_topic;
  v_new_streak := v_streak;
  v_attempts := COALESCE(v_attempts, '[]'::jsonb) ||
                jsonb_build_array(jsonb_build_object('correct', _is_correct, 'ts', now()));

  IF _is_validation THEN
    -- Validation: collect 5 attempts, check ≥80%
    v_total_in_validation := jsonb_array_length(v_attempts);
    SELECT count(*) INTO v_correct_in_validation
      FROM jsonb_array_elements(v_attempts) e
      WHERE (e->>'correct')::boolean = true;

    IF v_total_in_validation >= 5 THEN
      IF v_correct_in_validation::numeric / v_total_in_validation >= 0.8 THEN
        -- Passed → topic improved, clear phase, recompute will pick next weak
        v_new_phase := 'idle';
        v_new_topic := NULL;
        v_new_streak := 0;
        v_attempts := '[]'::jsonb;
      ELSE
        -- Failed → back to lesson
        v_new_phase := 'lesson';
        v_new_streak := 0;
        v_attempts := '[]'::jsonb;
      END IF;
    END IF;
  ELSE
    -- Practice phase
    IF NOT _is_correct THEN
      -- Wrong → back to lesson
      v_new_phase := 'lesson';
      v_new_streak := 0;
      v_attempts := '[]'::jsonb;
    ELSE
      v_new_streak := v_streak + 1;
      IF v_new_streak >= 2 THEN
        -- 2 correct in a row → validation
        v_new_phase := 'validation';
        v_new_streak := 0;
        v_attempts := '[]'::jsonb;
      END IF;
    END IF;
  END IF;

  -- If user is in lesson phase and answers (e.g. checkpoint), promote to practice
  IF v_phase = 'lesson' AND _is_correct THEN
    v_new_phase := 'practice';
    v_new_streak := 1;
  END IF;

  UPDATE public.user_learning_state SET
    mastery_phase = v_new_phase,
    phase_topic = v_new_topic,
    phase_correct_streak = v_new_streak,
    phase_attempts = v_attempts,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Trigger recompute (will pick next weak topic if idle)
  PERFORM public.recompute_learning_state(_user_id);

  RETURN jsonb_build_object(
    'changed', true,
    'old_phase', v_phase,
    'new_phase', v_new_phase,
    'new_topic', v_new_topic,
    'streak', v_new_streak
  );
END;
$$;

-- 4. Функция перевода lesson→practice (после нажатия "Я посмотрел урок")
CREATE OR REPLACE FUNCTION public.complete_mastery_lesson(_user_id uuid, _topic text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.user_learning_state SET
    mastery_phase = 'practice',
    phase_topic = _topic,
    phase_correct_streak = 0,
    phase_attempts = '[]'::jsonb,
    updated_at = now()
  WHERE user_id = _user_id AND phase_topic = _topic AND mastery_phase = 'lesson';

  PERFORM public.recompute_learning_state(_user_id);
  RETURN jsonb_build_object('ok', true);
END;
$$;