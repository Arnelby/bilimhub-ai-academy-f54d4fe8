
CREATE OR REPLACE FUNCTION public.sync_participant_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pid text;
  v_group experiment_group;
BEGIN
  SELECT participant_id, group_type INTO v_pid, v_group
  FROM beta_whitelist
  WHERE LOWER(email) = LOWER(NEW.email)
    AND is_active = true
  LIMIT 1;
  
  IF v_pid IS NOT NULL AND (NEW.participant_id IS NULL OR NEW.participant_id != v_pid) THEN
    NEW.participant_id := v_pid;
  END IF;
  
  IF v_group IS NOT NULL AND (NEW.group_type IS NULL OR NEW.group_type != v_group) THEN
    NEW.group_type := v_group;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on profiles
DROP TRIGGER IF EXISTS trg_sync_participant_id ON public.profiles;
CREATE TRIGGER trg_sync_participant_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_participant_id();
