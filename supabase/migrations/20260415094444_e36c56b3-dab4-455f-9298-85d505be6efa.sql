
-- 1. Create practice_sessions table
CREATE TABLE public.practice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  participant_id text,
  group_type text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  total_time_seconds integer DEFAULT 0,
  num_tasks integer DEFAULT 0,
  num_correct integer DEFAULT 0,
  practice_type text DEFAULT 'general',
  weak_topics jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own practice sessions"
  ON public.practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions"
  ON public.practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions"
  ON public.practice_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Create practice_responses table
CREATE TABLE public.practice_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  participant_id text,
  question_index integer NOT NULL,
  topic text,
  difficulty text,
  question_data jsonb DEFAULT '{}'::jsonb,
  user_answer text,
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own practice responses"
  ON public.practice_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice responses"
  ON public.practice_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Add participant_id to existing tables that lack it
ALTER TABLE public.question_attempts ADD COLUMN IF NOT EXISTS participant_id text;
ALTER TABLE public.ai_learning_plans_v2 ADD COLUMN IF NOT EXISTS participant_id text;
ALTER TABLE public.user_tests ADD COLUMN IF NOT EXISTS participant_id text;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS participant_id text;

-- 4. Add indexes for research queries
CREATE INDEX idx_practice_sessions_participant ON public.practice_sessions(participant_id);
CREATE INDEX idx_practice_sessions_user ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_responses_session ON public.practice_responses(session_id);
CREATE INDEX idx_practice_responses_participant ON public.practice_responses(participant_id);
