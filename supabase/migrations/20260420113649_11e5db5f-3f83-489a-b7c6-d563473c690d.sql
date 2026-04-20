-- Единое состояние обучения пользователя
CREATE TABLE public.user_learning_state (
  user_id UUID NOT NULL PRIMARY KEY,
  current_step TEXT NOT NULL DEFAULT 'test' CHECK (current_step IN ('test','practice','review','done')),
  weak_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  strong_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_topic TEXT,
  daily_goal INTEGER NOT NULL DEFAULT 10,
  daily_progress INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  next_action TEXT NOT NULL DEFAULT 'test' CHECK (next_action IN ('test','practice','review_errors','completed')),
  next_reason TEXT,
  errors_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_learning_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning state"
  ON public.user_learning_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning state"
  ON public.user_learning_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning state"
  ON public.user_learning_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_learning_state_updated
  BEFORE UPDATE ON public.user_learning_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_learning_state_updated_at ON public.user_learning_state(updated_at DESC);