
-- Add data_version and is_reliable to all research tables
ALTER TABLE public.user_tests
  ADD COLUMN IF NOT EXISTS data_version TEXT NOT NULL DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS is_reliable BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.question_attempts
  ADD COLUMN IF NOT EXISTS data_version TEXT NOT NULL DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS is_reliable BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.user_answers
  ADD COLUMN IF NOT EXISTS data_version TEXT NOT NULL DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS is_reliable BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.practice_sessions
  ADD COLUMN IF NOT EXISTS data_version TEXT NOT NULL DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS is_reliable BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.practice_responses
  ADD COLUMN IF NOT EXISTS data_version TEXT NOT NULL DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS is_reliable BOOLEAN NOT NULL DEFAULT true;

-- Backfill: tag ALL existing records as legacy/unreliable
UPDATE public.user_tests SET data_version = 'legacy', is_reliable = false WHERE data_version = 'v2';
UPDATE public.question_attempts SET data_version = 'legacy', is_reliable = false WHERE data_version = 'v2';
UPDATE public.user_answers SET data_version = 'legacy', is_reliable = false WHERE data_version = 'v2';
UPDATE public.practice_sessions SET data_version = 'legacy', is_reliable = false WHERE data_version = 'v2';
UPDATE public.practice_responses SET data_version = 'legacy', is_reliable = false WHERE data_version = 'v2';

-- Research views: clean data only
CREATE OR REPLACE VIEW public.research_clean_tests AS
SELECT * FROM public.user_tests
WHERE data_version = 'v2' AND is_reliable = true;

CREATE OR REPLACE VIEW public.research_clean_attempts AS
SELECT * FROM public.question_attempts
WHERE data_version = 'v2' AND is_reliable = true;

CREATE OR REPLACE VIEW public.research_clean_practice AS
SELECT * FROM public.practice_responses
WHERE data_version = 'v2' AND is_reliable = true;

CREATE OR REPLACE VIEW public.research_clean_sessions AS
SELECT * FROM public.practice_sessions
WHERE data_version = 'v2' AND is_reliable = true;
