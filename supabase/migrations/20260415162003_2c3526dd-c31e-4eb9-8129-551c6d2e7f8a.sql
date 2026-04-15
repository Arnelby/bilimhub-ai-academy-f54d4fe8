
-- Create test_access table
CREATE TABLE public.test_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id text NOT NULL,
  test_id integer NOT NULL,
  is_allowed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (participant_id, test_id)
);

-- Enable RLS
ALTER TABLE public.test_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own test access (matched via profiles)
CREATE POLICY "Users can view their own test access"
ON public.test_access
FOR SELECT
TO authenticated
USING (
  participant_id IN (
    SELECT p.participant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.participant_id IS NOT NULL
  )
);

-- Admins can manage all test access
CREATE POLICY "Admins can manage all test access"
ON public.test_access
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_test_access_updated_at
BEFORE UPDATE ON public.test_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Populate for all existing participants from beta_whitelist
INSERT INTO public.test_access (participant_id, test_id, is_allowed)
SELECT bw.participant_id, t.test_id, (t.test_id = 1)
FROM beta_whitelist bw
CROSS JOIN (VALUES (1), (2), (3), (4)) AS t(test_id)
WHERE bw.participant_id IS NOT NULL
ON CONFLICT (participant_id, test_id) DO NOTHING;
