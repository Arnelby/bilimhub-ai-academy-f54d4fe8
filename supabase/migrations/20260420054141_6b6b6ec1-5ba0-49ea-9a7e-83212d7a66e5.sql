CREATE UNIQUE INDEX IF NOT EXISTS practice_responses_session_question_unique_idx
ON public.practice_responses (session_id, question_id)
WHERE question_id IS NOT NULL;