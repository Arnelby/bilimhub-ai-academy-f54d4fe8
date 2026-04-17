-- Allow upsert of practice_responses per (session, question) and updates by owner
CREATE UNIQUE INDEX IF NOT EXISTS practice_responses_session_question_unique
  ON public.practice_responses (session_id, question_id)
  WHERE question_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can update their own practice responses" ON public.practice_responses;
CREATE POLICY "Users can update their own practice responses"
  ON public.practice_responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);