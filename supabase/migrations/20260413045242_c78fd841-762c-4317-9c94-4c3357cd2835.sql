-- Add participant_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS participant_id text;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_participant_id ON public.profiles(participant_id);

-- Sync existing participant_ids from beta_whitelist to profiles
UPDATE public.profiles p
SET participant_id = bw.participant_id
FROM public.beta_whitelist bw
WHERE LOWER(p.email) = LOWER(bw.email)
  AND bw.participant_id IS NOT NULL
  AND (p.participant_id IS NULL OR p.participant_id != bw.participant_id);

-- Create function to auto-sync participant_id on profile update/login
CREATE OR REPLACE FUNCTION public.sync_participant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pid text;
BEGIN
  SELECT participant_id INTO v_pid
  FROM beta_whitelist
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;
  
  IF v_pid IS NOT NULL AND (NEW.participant_id IS NULL OR NEW.participant_id != v_pid) THEN
    NEW.participant_id := v_pid;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on profile insert/update
DROP TRIGGER IF EXISTS trg_sync_participant_id ON public.profiles;
CREATE TRIGGER trg_sync_participant_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_participant_id();