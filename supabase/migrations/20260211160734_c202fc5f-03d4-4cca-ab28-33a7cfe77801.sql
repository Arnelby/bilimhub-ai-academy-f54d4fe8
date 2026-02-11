
-- 1. Fix use_invite_code() - add auth.uid() check
CREATE OR REPLACE FUNCTION public.use_invite_code(_code text, _user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code_id uuid;
  v_max_uses integer;
  v_times_used integer;
  v_is_active boolean;
  v_expires_at timestamp with time zone;
BEGIN
  IF _user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF EXISTS (SELECT 1 FROM beta_access WHERE user_id = _user_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already has access');
  END IF;

  SELECT id, max_uses, times_used, is_active, expires_at
  INTO v_code_id, v_max_uses, v_times_used, v_is_active, v_expires_at
  FROM invite_codes WHERE code = _code;

  IF v_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
  END IF;
  IF NOT v_is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code is inactive');
  END IF;
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has expired');
  END IF;
  IF v_times_used >= v_max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite code has been fully used');
  END IF;

  UPDATE invite_codes SET times_used = times_used + 1 WHERE id = v_code_id;
  INSERT INTO beta_access (user_id, invite_code_id, granted_by)
  VALUES (_user_id, v_code_id, 'invite_code');

  RETURN jsonb_build_object('success', true, 'message', 'Access granted');
END;
$function$;

-- 2. Fix has_beta_access() - add auth.uid() check
CREATE OR REPLACE FUNCTION public.has_beta_access(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.beta_access
    WHERE user_id = _user_id AND is_active = true
  );
END;
$function$;

-- 3. Fix storage policies - replace jwt role checks with has_role()
DROP POLICY IF EXISTS "Admin can upload lessons" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete lessons" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload materials" ON storage.objects;

CREATE POLICY "Admin can upload lessons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lessons' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete lessons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lessons' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-materials' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix get_lesson_video_url() - add path traversal protection
CREATE OR REPLACE FUNCTION public.get_lesson_video_url(
  video_path TEXT,
  expires_in INT DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  normalized_path TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  normalized_path := regexp_replace(video_path, '[^a-zA-Z0-9/_.-]', '', 'g');
  IF normalized_path ~ '\.\.' OR normalized_path ~ '^/' THEN
    RAISE EXCEPTION 'Invalid video path';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'lessons' AND name = normalized_path
  ) THEN
    RAISE EXCEPTION 'Video not found';
  END IF;
  RETURN format('https://%s.supabase.co/storage/v1/object/sign/lessons/%s?expires=%s',
    current_setting('app.settings.project_ref', true),
    normalized_path, expires_in);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
