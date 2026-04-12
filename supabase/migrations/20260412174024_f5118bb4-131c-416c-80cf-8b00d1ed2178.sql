
-- 1. Drop unused tables safely
DROP TABLE IF EXISTS public.admin_topics CASCADE;
DROP TABLE IF EXISTS public.admin_training_datasets CASCADE;
DROP TABLE IF EXISTS public.ai_learning_plans CASCADE;
DROP TABLE IF EXISTS public.saved_terms CASCADE;

-- 2. Create AI request logs table
CREATE TABLE public.ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response_time_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs"
  ON public.ai_request_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI logs"
  ON public.ai_request_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all logs
CREATE POLICY "Admins can view all AI logs"
  ON public.ai_request_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_request_logs_user ON public.ai_request_logs(user_id, created_at DESC);

-- 3. Sync profiles.group_type from beta_whitelist
UPDATE public.profiles p
SET group_type = bw.group_type
FROM public.beta_whitelist bw
WHERE LOWER(p.email) = LOWER(bw.email);
