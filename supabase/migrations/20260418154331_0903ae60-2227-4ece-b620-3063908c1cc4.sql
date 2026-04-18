-- Add quality classification column to practice_questions
ALTER TABLE public.practice_questions
  ADD COLUMN IF NOT EXISTS quality_status text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.practice_questions
  ADD COLUMN IF NOT EXISTS quality_reason text;

CREATE INDEX IF NOT EXISTS practice_questions_quality_status_idx
  ON public.practice_questions (quality_status);

-- Allowed values guard (soft check, easy to extend later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'practice_questions_quality_status_check'
  ) THEN
    ALTER TABLE public.practice_questions
      ADD CONSTRAINT practice_questions_quality_status_check
      CHECK (quality_status IN ('keep','remove','review','unknown'));
  END IF;
END$$;