-- Add user_answer and correct_answer to question_attempts
ALTER TABLE public.question_attempts
  ADD COLUMN IF NOT EXISTS user_answer TEXT,
  ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- Add group_type to user_tests
ALTER TABLE public.user_tests
  ADD COLUMN IF NOT EXISTS group_type TEXT;