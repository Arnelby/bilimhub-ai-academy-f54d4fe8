-- Extend spaced_repetition to be the unified per-question learning state
ALTER TABLE public.spaced_repetition
  ADD COLUMN IF NOT EXISTS fail_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS success_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS linked_video_id text,
  ADD COLUMN IF NOT EXISTS linked_lesson_id text,
  ADD COLUMN IF NOT EXISTS topic text;

-- Status values used: 'new' | 'failed' | 'learning' | 'mastered'
-- next_review_date already exists; we keep it.

-- Unique per (user, question) so upsert works deterministically
CREATE UNIQUE INDEX IF NOT EXISTS spaced_repetition_user_question_uidx
  ON public.spaced_repetition (user_id, question_id);

CREATE INDEX IF NOT EXISTS spaced_repetition_due_idx
  ON public.spaced_repetition (user_id, next_review_date)
  WHERE status IN ('failed','learning');