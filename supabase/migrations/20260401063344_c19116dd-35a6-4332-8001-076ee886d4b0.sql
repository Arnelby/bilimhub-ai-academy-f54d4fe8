
-- Create beta_whitelist table
CREATE TABLE IF NOT EXISTS public.beta_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  invite_code text NOT NULL,
  is_active boolean DEFAULT true,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.beta_whitelist ENABLE ROW LEVEL SECURITY;

-- Allow the validate function (SECURITY DEFINER) to access it
-- No direct user access needed

-- Create validation function for login
CREATE OR REPLACE FUNCTION public.validate_whitelist_login(_email text, _invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM beta_whitelist
  WHERE LOWER(email) = LOWER(_email)
    AND invite_code = UPPER(TRIM(_invite_code))
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'error', 'Access is restricted. You need an invite.');
  END IF;

  -- Mark as used if not already
  IF v_record.used_at IS NULL THEN
    UPDATE beta_whitelist SET used_at = now() WHERE id = v_record.id;
  END IF;

  RETURN json_build_object('allowed', true);
END;
$$;

-- Insert the 5 beta testers
INSERT INTO public.beta_whitelist (email, invite_code, notes, is_active)
VALUES
  ('elitabelekova998@gmail.com', 'BETA2024-EL', 'Beta Tester 1', true),
  ('h80963998@gmail.com', 'BETA2024-H8', 'Beta Tester 2', true),
  ('keneshbekovaindira1@gmail.com', 'BETA2024-KI', 'Beta Tester 3', true),
  ('dianabakeeva572@gmail.com', 'BETA2024-DB', 'Beta Tester 4', true),
  ('rashidovarnel@gmail.com', 'BETA2024-AR', 'Beta Tester 5', true)
ON CONFLICT (email) DO UPDATE SET
  invite_code = EXCLUDED.invite_code,
  is_active = true,
  notes = EXCLUDED.notes;
