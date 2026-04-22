
-- ============================================================
-- MASTERY MODE: deterministic per-topic mastery state + mistake queue
-- ============================================================

-- 1. Status enum
DO $$ BEGIN
  CREATE TYPE public.topic_mastery_status AS ENUM ('new', 'learning', 'mastering', 'mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Per-user, per-topic mastery state
CREATE TABLE IF NOT EXISTS public.topic_mastery_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  status public.topic_mastery_status NOT NULL DEFAULT 'new',
  total_attempts integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  accuracy double precision NOT NULL DEFAULT 0,
  consecutive_wrong integer NOT NULL DEFAULT 0,
  needs_lesson boolean NOT NULL DEFAULT false,
  last_lesson_watched_at timestamptz,
  mastered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic)
);

ALTER TABLE public.topic_mastery_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own mastery" ON public.topic_mastery_state;
CREATE POLICY "Users view own mastery"
  ON public.topic_mastery_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own mastery" ON public.topic_mastery_state;
CREATE POLICY "Users insert own mastery"
  ON public.topic_mastery_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own mastery" ON public.topic_mastery_state;
CREATE POLICY "Users update own mastery"
  ON public.topic_mastery_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tms_user ON public.topic_mastery_state(user_id);
CREATE INDEX IF NOT EXISTS idx_tms_user_status ON public.topic_mastery_state(user_id, status);

-- 3. Mistake queue — wrong question repeats until 2 consecutive correct
CREATE TABLE IF NOT EXISTS public.mistake_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id text NOT NULL,
  topic text NOT NULL,
  correct_streak integer NOT NULL DEFAULT 0,
  total_attempts integer NOT NULL DEFAULT 1,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.mistake_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own mistakes" ON public.mistake_queue;
CREATE POLICY "Users view own mistakes"
  ON public.mistake_queue FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own mistakes" ON public.mistake_queue;
CREATE POLICY "Users insert own mistakes"
  ON public.mistake_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own mistakes" ON public.mistake_queue;
CREATE POLICY "Users update own mistakes"
  ON public.mistake_queue FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mq_user_unresolved ON public.mistake_queue(user_id, resolved) WHERE resolved = false;

-- 4. updated_at trigger
DROP TRIGGER IF EXISTS trg_tms_updated_at ON public.topic_mastery_state;
CREATE TRIGGER trg_tms_updated_at
  BEFORE UPDATE ON public.topic_mastery_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_mq_updated_at ON public.mistake_queue;
CREATE TRIGGER trg_mq_updated_at
  BEFORE UPDATE ON public.mistake_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
