
-- 1. Table
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active', -- active | paused | completed
  topic text,
  step text NOT NULL DEFAULT 'question', -- question | explanation | result
  current_question_id text,
  current_question_source text, -- spaced_repetition | weak_topic | pool
  current_question_payload jsonb,
  last_answer_correct boolean,
  last_answer_explanation text,
  last_correct_answer text,
  last_user_answer text,
  questions_answered integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  max_questions integer NOT NULL DEFAULT 5,
  started_at timestamptz NOT NULL DEFAULT now(),
  paused_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- only one active/paused session per user
CREATE UNIQUE INDEX IF NOT EXISTS learning_sessions_one_open_per_user
  ON public.learning_sessions(user_id)
  WHERE status IN ('active','paused');

CREATE INDEX IF NOT EXISTS learning_sessions_user_idx
  ON public.learning_sessions(user_id, status);

ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own learning sessions" ON public.learning_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own learning sessions" ON public.learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own learning sessions" ON public.learning_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. start or resume
CREATE OR REPLACE FUNCTION public.start_or_resume_learning_session(_topic text DEFAULT NULL)
RETURNS public.learning_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.learning_sessions;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- existing open session?
  SELECT * INTO v_row FROM public.learning_sessions
  WHERE user_id = v_uid AND status IN ('active','paused')
  ORDER BY started_at DESC LIMIT 1;

  IF FOUND THEN
    -- resume
    UPDATE public.learning_sessions SET
      status = 'active',
      is_active = true,
      paused_at = NULL,
      updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  INSERT INTO public.learning_sessions (user_id, topic, status, is_active, step)
  VALUES (v_uid, _topic, 'active', true, 'question')
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 3. pause
CREATE OR REPLACE FUNCTION public.pause_learning_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.learning_sessions SET
    status = 'paused', is_active = false, paused_at = now(), updated_at = now()
  WHERE user_id = auth.uid() AND status = 'active';
END;
$$;

-- 4. complete
CREATE OR REPLACE FUNCTION public.complete_learning_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.learning_sessions SET
    status = 'completed', is_active = false, completed_at = now(),
    step = 'result', updated_at = now()
  WHERE user_id = auth.uid() AND status IN ('active','paused');
END;
$$;

-- 5. extend (5 -> 10)
CREATE OR REPLACE FUNCTION public.extend_learning_session(_extra integer DEFAULT 5)
RETURNS public.learning_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.learning_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.learning_sessions SET
    max_questions = LEAST(max_questions + GREATEST(_extra,1), 10),
    step = 'question',
    updated_at = now()
  WHERE user_id = auth.uid() AND status = 'active'
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 6. set current question (called by client after picking)
CREATE OR REPLACE FUNCTION public.set_learning_current_question(
  _question_id text, _source text, _payload jsonb
)
RETURNS public.learning_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.learning_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.learning_sessions SET
    current_question_id = _question_id,
    current_question_source = _source,
    current_question_payload = _payload,
    step = 'question',
    last_answer_correct = NULL,
    last_answer_explanation = NULL,
    last_correct_answer = NULL,
    last_user_answer = NULL,
    updated_at = now()
  WHERE user_id = auth.uid() AND status = 'active'
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 7. record answer (advances to explanation)
CREATE OR REPLACE FUNCTION public.record_learning_answer(
  _is_correct boolean,
  _user_answer text,
  _correct_answer text,
  _explanation text
)
RETURNS public.learning_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.learning_sessions;
  v_next_step text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  UPDATE public.learning_sessions SET
    questions_answered = questions_answered + 1,
    correct_count = correct_count + CASE WHEN _is_correct THEN 1 ELSE 0 END,
    last_answer_correct = _is_correct,
    last_user_answer = _user_answer,
    last_correct_answer = _correct_answer,
    last_answer_explanation = _explanation,
    step = 'explanation',
    updated_at = now()
  WHERE user_id = auth.uid() AND status = 'active'
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 8. advance from explanation to next or result
CREATE OR REPLACE FUNCTION public.advance_learning_step()
RETURNS public.learning_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_row public.learning_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_row FROM public.learning_sessions
  WHERE user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN RAISE EXCEPTION 'No active session'; END IF;

  IF v_row.questions_answered >= v_row.max_questions THEN
    UPDATE public.learning_sessions SET step = 'result', updated_at = now()
    WHERE id = v_row.id RETURNING * INTO v_row;
  ELSE
    UPDATE public.learning_sessions SET step = 'question', updated_at = now()
    WHERE id = v_row.id RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;
