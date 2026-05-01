-- =================================================================
-- STEP 1+3+5+6: SSoT classification, locked practice, difficulty,
--               seeded random, RPC v2, RLS on backups.
-- Reversible. Original columns untouched.
-- =================================================================

-- ============ STEP 1 — single source of truth for classification ============
CREATE OR REPLACE FUNCTION public.is_weak_topic(_accuracy numeric, _attempts integer)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _attempts >= 3 AND _accuracy < 0.6;
$$;

CREATE OR REPLACE FUNCTION public.is_mastered_topic(_accuracy numeric, _attempts integer)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _attempts >= 5 AND _accuracy >= 0.8;
$$;

CREATE OR REPLACE FUNCTION public.topic_classification(_accuracy numeric, _attempts integer)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _attempts < 3 THEN 'new'
    WHEN _accuracy < 0.6 THEN 'weak'
    WHEN _accuracy >= 0.8 AND _attempts >= 5 THEN 'mastered'
    ELSE 'medium'
  END;
$$;

-- ============ STEP 5 — difficulty column + backfill from success rate ============
ALTER TABLE public.practice_questions
  ADD COLUMN IF NOT EXISTS difficulty text;

-- View for live success rate (used both for backfill and runtime fallback)
CREATE OR REPLACE VIEW public.practice_question_stats AS
SELECT
  pq.id AS question_id,
  pq.topic_normalized AS topic,
  COUNT(pr.id) AS total_attempts,
  SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
  CASE WHEN COUNT(pr.id) > 0
       THEN ROUND(SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END)::numeric
                  / COUNT(pr.id), 3)
       ELSE NULL END AS success_rate
FROM public.practice_questions pq
LEFT JOIN public.practice_responses pr
  ON pr.question_id = ('pq_' || pq.id::text)
GROUP BY pq.id, pq.topic_normalized;

-- Backfill difficulty: easy >=0.75, hard <0.4, medium otherwise.
-- Questions without enough attempts → medium (neutral default).
WITH stats AS (
  SELECT question_id, total_attempts, success_rate
  FROM public.practice_question_stats
)
UPDATE public.practice_questions pq
SET difficulty = CASE
  WHEN s.total_attempts >= 5 AND s.success_rate >= 0.75 THEN 'easy'
  WHEN s.total_attempts >= 5 AND s.success_rate <  0.40 THEN 'hard'
  WHEN s.total_attempts >= 5                            THEN 'medium'
  ELSE 'medium'
END
FROM stats s
WHERE pq.id = s.question_id
  AND pq.difficulty IS DISTINCT FROM (CASE
        WHEN s.total_attempts >= 5 AND s.success_rate >= 0.75 THEN 'easy'
        WHEN s.total_attempts >= 5 AND s.success_rate <  0.40 THEN 'hard'
        WHEN s.total_attempts >= 5                            THEN 'medium'
        ELSE 'medium' END);

CREATE INDEX IF NOT EXISTS idx_pq_difficulty ON public.practice_questions(difficulty);

-- ============ STEP 6 — deterministic seeded random ============
CREATE OR REPLACE FUNCTION public.seeded_random(_seed text)
RETURNS double precision LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  -- Map md5 hex prefix -> [0,1). Same seed → same value.
  SELECT ('x' || substr(md5(_seed), 1, 12))::bit(48)::bigint::double precision
         / 281474976710656.0;
$$;

-- ============ STEP 3 — backend lock: start_practice_session ============
-- Returns either a session row OR a structured "blocked" error with reason.
CREATE OR REPLACE FUNCTION public.start_practice_session(
  _topic text DEFAULT NULL,
  _practice_type text DEFAULT 'general'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_topic_canonical text;
  v_lesson_id uuid;
  v_lesson_completed boolean := false;
  v_topic_acc numeric := 0;
  v_topic_attempts integer := 0;
  v_session_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_topic_canonical := public.normalize_topic(COALESCE(_topic, ''));

  -- If topic provided → enforce lesson-before-practice rule for WEAK topics
  IF v_topic_canonical IS NOT NULL AND length(v_topic_canonical) > 0 THEN
    -- Get current accuracy for the topic
    SELECT
      COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::numeric
               / NULLIF(COUNT(*),0), 0),
      COUNT(*)
    INTO v_topic_acc, v_topic_attempts
    FROM public.practice_responses
    WHERE user_id = v_uid
      AND topic_normalized = v_topic_canonical;

    -- Find lesson for the topic (lessons.topic_id -> topics.title = canonical EN)
    SELECT l.id INTO v_lesson_id
    FROM public.lessons l
    JOIN public.topics  t ON t.id = l.topic_id
    WHERE t.title = v_topic_canonical
    LIMIT 1;

    IF v_lesson_id IS NOT NULL THEN
      SELECT COALESCE(bool_or(completed), false) INTO v_lesson_completed
      FROM public.user_lesson_progress
      WHERE user_id = v_uid AND lesson_id = v_lesson_id::text;
    END IF;

    -- BLOCK if topic is weak AND lesson exists AND lesson NOT completed
    IF public.is_weak_topic(v_topic_acc, v_topic_attempts)
       AND v_lesson_id IS NOT NULL
       AND NOT v_lesson_completed THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'lesson_required',
        'topic', v_topic_canonical,
        'lesson_id', v_lesson_id,
        'accuracy', v_topic_acc,
        'attempts', v_topic_attempts
      );
    END IF;
  END IF;

  -- Allowed → create session
  INSERT INTO public.practice_sessions (user_id, practice_type, status, started_at)
  VALUES (v_uid, COALESCE(_practice_type, 'general'), 'active', now())
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'session_id', v_session_id,
    'topic', v_topic_canonical
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.start_practice_session(text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.start_practice_session(text, text) TO authenticated;

-- ============ STEP 5 — adaptive question selection (v2) ============
CREATE OR REPLACE FUNCTION public.get_practice_questions_v2(
  _topic text,
  _difficulty text DEFAULT NULL,
  _limit integer DEFAULT 10
) RETURNS TABLE (
  id uuid, topic text, question_type text, correct_answer text,
  question_data jsonb, difficulty text,
  correct_explanation text,
  explanation_a text, explanation_b text, explanation_c text,
  explanation_d text, explanation_e text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_canonical text := public.normalize_topic(_topic);
  v_seed text;
  v_safe_limit integer := GREATEST(1, LEAST(COALESCE(_limit, 10), 50));
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  v_seed := v_uid::text || ':' || COALESCE(v_canonical, '') || ':' || COALESCE(_difficulty, '');

  RETURN QUERY
  WITH base AS (
    SELECT pq.id, pq.topic_normalized AS topic, pq.question_type,
           pq.correct_answer, pq.question_data, pq.difficulty,
           pq.correct_explanation,
           pq.explanation_a, pq.explanation_b, pq.explanation_c,
           pq.explanation_d, pq.explanation_e,
           public.seeded_random(v_seed || ':' || pq.id::text) AS r
    FROM public.practice_questions pq
    WHERE pq.correct_answer IS NOT NULL
      AND pq.quality_status IN ('keep','approved','unknown')
      AND pq.topic_normalized = v_canonical
      AND (_difficulty IS NULL OR pq.difficulty = _difficulty)
  )
  SELECT b.id, b.topic, b.question_type, b.correct_answer, b.question_data,
         b.difficulty, b.correct_explanation,
         b.explanation_a, b.explanation_b, b.explanation_c,
         b.explanation_d, b.explanation_e
  FROM base b
  ORDER BY b.r
  LIMIT v_safe_limit;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_practice_questions_v2(text, text, integer) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_practice_questions_v2(text, text, integer) TO authenticated;

-- ============ STEP 1 (cont.) — recompute_learning_state v2 ============
-- Uses topic_normalized + SSoT classification.
CREATE OR REPLACE FUNCTION public.recompute_learning_state(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_topic_stats jsonb := '{}'::jsonb;
  v_recent jsonb := '{}'::jsonb;
  v_weak jsonb := '[]'::jsonb;
  v_strong jsonb := '[]'::jsonb;
  v_phase text; v_phase_topic text; v_phase_streak int;
  v_next_action text; v_next_reason text;
BEGIN
  -- Per-topic stats from canonical column (last 90d)
  WITH unified AS (
    SELECT topic_normalized AS topic, is_correct
      FROM public.practice_responses
      WHERE user_id = _user_id AND topic_normalized IS NOT NULL
        AND created_at > now() - interval '90 days'
    UNION ALL
    SELECT public.normalize_topic(topic) AS topic, is_correct
      FROM public.question_attempts
      WHERE user_id = _user_id AND topic IS NOT NULL
        AND created_at > now() - interval '90 days'
  ),
  per_topic AS (
    SELECT topic,
           count(*)::int AS total_attempts,
           sum(CASE WHEN is_correct THEN 1 ELSE 0 END)::int AS correct_answers
    FROM unified GROUP BY topic
  )
  SELECT COALESCE(jsonb_object_agg(topic, jsonb_build_object(
           'total_attempts', total_attempts,
           'correct_answers', correct_answers,
           'accuracy', CASE WHEN total_attempts > 0
                            THEN round((correct_answers::numeric / total_attempts) * 100) / 100
                            ELSE 0 END,
           'classification', public.topic_classification(
             CASE WHEN total_attempts > 0
                  THEN correct_answers::numeric / total_attempts ELSE 0 END,
             total_attempts)
         )), '{}'::jsonb)
  INTO v_topic_stats FROM per_topic;

  -- Weak topics (canonical EN), only those with a lesson available
  WITH topics_with_lessons AS (
    SELECT DISTINCT t.title AS topic_title
    FROM public.lessons l
    JOIN public.topics  t ON t.id = l.topic_id
  )
  SELECT COALESCE(jsonb_agg(topic ORDER BY accuracy ASC, total_attempts DESC), '[]'::jsonb)
  INTO v_weak
  FROM (
    SELECT key AS topic,
           (value->>'accuracy')::numeric AS accuracy,
           (value->>'total_attempts')::int AS total_attempts
    FROM jsonb_each(v_topic_stats)
    WHERE public.is_weak_topic((value->>'accuracy')::numeric,
                               (value->>'total_attempts')::int)
      AND key IN (SELECT topic_title FROM topics_with_lessons)
  ) w;

  -- Strong / mastered topics (SSoT)
  SELECT COALESCE(jsonb_agg(key), '[]'::jsonb)
  INTO v_strong
  FROM jsonb_each(v_topic_stats)
  WHERE public.is_mastered_topic((value->>'accuracy')::numeric,
                                 (value->>'total_attempts')::int);

  -- Phase machine (unchanged semantics, uses canonical topics)
  SELECT mastery_phase, phase_topic, phase_correct_streak
    INTO v_phase, v_phase_topic, v_phase_streak
  FROM public.user_learning_state
  WHERE user_id = _user_id;

  IF v_phase IS NULL THEN v_phase := 'idle'; v_phase_streak := 0; END IF;

  IF v_phase_topic IS NOT NULL
     AND (v_strong ? v_phase_topic OR NOT (v_weak ? v_phase_topic)) THEN
    v_phase := 'idle'; v_phase_topic := NULL; v_phase_streak := 0;
  END IF;

  IF v_phase = 'idle' AND jsonb_array_length(v_weak) > 0 THEN
    v_phase := 'lesson';
    v_phase_topic := v_weak->>0;
    v_phase_streak := 0;
  END IF;

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
    _user_id, v_topic_stats, v_weak, v_strong,
    v_phase, v_phase_topic, v_phase_streak,
    v_recent, v_next_action, v_next_reason,
    v_phase, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    topic_stats = EXCLUDED.topic_stats,
    weak_topics = EXCLUDED.weak_topics,
    strong_topics = EXCLUDED.strong_topics,
    mastery_phase = EXCLUDED.mastery_phase,
    phase_topic = EXCLUDED.phase_topic,
    phase_correct_streak = EXCLUDED.phase_correct_streak,
    next_action = EXCLUDED.next_action,
    next_reason = EXCLUDED.next_reason,
    current_step = EXCLUDED.current_step,
    updated_at = now();

  RETURN jsonb_build_object(
    'mastery_phase', v_phase,
    'phase_topic', v_phase_topic,
    'weak_topics', v_weak,
    'strong_topics', v_strong,
    'next_action', v_next_action,
    'next_reason', v_next_reason
  );
END;
$$;

-- ============ Backups: enable RLS, admin-only access ============
ALTER TABLE public.practice_questions_backup   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_responses_backup   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery_state_backup  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_canonical_map         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read pq backup"  ON public.practice_questions_backup
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read pr backup"  ON public.practice_responses_backup
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read tms backup" ON public.topic_mastery_state_backup
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Auth read topic map"    ON public.topic_canonical_map
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage topic map" ON public.topic_canonical_map
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));