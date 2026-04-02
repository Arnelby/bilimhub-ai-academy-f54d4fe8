
-- 1. question_attempts table
CREATE TABLE public.question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_attempt_id UUID REFERENCES public.user_tests(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  topic TEXT,
  difficulty TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own question attempts"
  ON public.question_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question attempts"
  ON public.question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. user_sessions table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Add topic_context to ai_chat_messages
ALTER TABLE public.ai_chat_messages
  ADD COLUMN IF NOT EXISTS topic_context TEXT;

-- 4. Performance indexes for analytics
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON public.question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_created_at ON public.question_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_attempts_topic ON public.question_attempts(topic);
CREATE INDEX IF NOT EXISTS idx_question_attempts_test ON public.question_attempts(test_attempt_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON public.user_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_created ON public.ai_chat_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_tests_completed_at ON public.user_tests(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_tests_user_completed ON public.user_tests(user_id, completed_at DESC);
