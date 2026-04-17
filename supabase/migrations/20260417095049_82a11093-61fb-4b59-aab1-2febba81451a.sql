-- 1. ALTER practice_sessions: add status column (created_at already exists)
ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 2. CREATE practice_session_questions
CREATE TABLE IF NOT EXISTS public.practice_session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_session_questions ENABLE ROW LEVEL SECURITY;

-- RLS: tied to ownership of the parent practice_sessions row
CREATE POLICY "Users can view their own session questions"
ON public.practice_session_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.practice_sessions s
    WHERE s.id = practice_session_questions.session_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own session questions"
ON public.practice_session_questions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.practice_sessions s
    WHERE s.id = practice_session_questions.session_id
      AND s.user_id = auth.uid()
  )
);

-- 3. ALTER practice_responses: add question_id column (TEXT to match canonical IDs like mq_1_10)
ALTER TABLE public.practice_responses
  ADD COLUMN IF NOT EXISTS question_id TEXT;

-- 4. BACKFILL question_id from question_data->>'question_id' or 'qid'
UPDATE public.practice_responses
SET question_id = COALESCE(
  question_data->>'question_id',
  question_data->>'qid',
  question_data->>'id'
)
WHERE question_id IS NULL
  AND question_data IS NOT NULL
  AND (
    question_data ? 'question_id'
    OR question_data ? 'qid'
    OR question_data ? 'id'
  );

-- 5. ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_practice_responses_question_id
  ON public.practice_responses(question_id);

CREATE INDEX IF NOT EXISTS idx_practice_session_questions_session_id
  ON public.practice_session_questions(session_id);

CREATE INDEX IF NOT EXISTS idx_practice_session_questions_question_id
  ON public.practice_session_questions(question_id);
