
-- Create user_answers table for granular per-question answer tracking
CREATE TABLE public.user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_id TEXT NOT NULL,
  test_name TEXT NOT NULL,
  question_id TEXT NOT NULL,
  topic TEXT,
  selected_option INTEGER NOT NULL,
  correct_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own answers"
  ON public.user_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers"
  ON public.user_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX idx_user_answers_test_id ON public.user_answers(test_id);
CREATE INDEX idx_user_answers_question_id ON public.user_answers(question_id);
CREATE INDEX idx_user_answers_answered_at ON public.user_answers(answered_at DESC);
CREATE INDEX idx_user_answers_is_correct ON public.user_answers(user_id, is_correct);
