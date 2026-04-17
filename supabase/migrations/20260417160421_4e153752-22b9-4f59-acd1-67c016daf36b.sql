-- Deduplicate any existing rows so unique index can be created safely.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY session_id, question_id
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.practice_responses
  WHERE question_id IS NOT NULL
)
DELETE FROM public.practice_responses pr
USING ranked r
WHERE pr.id = r.id AND r.rn > 1;

-- Unique index required by upsert(onConflict: 'session_id,question_id')
CREATE UNIQUE INDEX IF NOT EXISTS practice_responses_session_question_uidx
  ON public.practice_responses (session_id, question_id);

-- Helpful index for session restore lookups
CREATE INDEX IF NOT EXISTS practice_session_questions_session_order_idx
  ON public.practice_session_questions (session_id, order_index);

-- Helpful index for finding the latest session per user
CREATE INDEX IF NOT EXISTS practice_sessions_user_status_started_idx
  ON public.practice_sessions (user_id, status, started_at DESC);