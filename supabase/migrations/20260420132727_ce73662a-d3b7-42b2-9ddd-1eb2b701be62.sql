-- Extend user_learning_state to be the single source of truth
ALTER TABLE public.user_learning_state
  ADD COLUMN IF NOT EXISTS topic_stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_lessons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS watched_videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_tests integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;