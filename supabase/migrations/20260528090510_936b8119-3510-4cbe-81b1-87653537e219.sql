
-- 1. Tighten profiles SELECT to own profile only (was exposing email via leaderboard_visible)
DROP POLICY IF EXISTS "Users can view own or leaderboard profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. SECURITY DEFINER RPC for safe leaderboard data (no email/full_name/participant_id)
CREATE OR REPLACE FUNCTION public.get_leaderboard_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  points integer,
  level integer,
  streak integer,
  last_activity_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.avatar_url, p.points, p.level, p.streak, p.last_activity_date
  FROM public.profiles p
  WHERE p.leaderboard_visible = true AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_profiles() TO authenticated;

-- 3. Explicit admin-only INSERT/UPDATE/DELETE policies on user_roles (defense in depth)
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. beta_whitelist: explicit admin-only policy (was RLS-on, zero policies)
CREATE POLICY "Admins can manage beta whitelist"
  ON public.beta_whitelist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. pq_explanation_staging: admin-only
CREATE POLICY "Admins can manage pq explanation staging"
  ON public.pq_explanation_staging FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Storage 'tests' bucket: admin-only INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert test files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tests' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update test files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tests' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete test files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tests' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Fix SECURITY DEFINER views — switch to security_invoker so they respect caller RLS
ALTER VIEW public.research_clean_tests SET (security_invoker = true);
ALTER VIEW public.research_topic_metrics SET (security_invoker = true);
ALTER VIEW public.research_clean_attempts SET (security_invoker = true);
ALTER VIEW public.practice_question_stats SET (security_invoker = true);
ALTER VIEW public.research_clean_sessions SET (security_invoker = true);
ALTER VIEW public.research_clean_practice SET (security_invoker = true);
ALTER VIEW public.research_user_metrics SET (security_invoker = true);

-- 8. Add explicit search_path to remaining SECURITY DEFINER functions
ALTER FUNCTION public.has_beta_access(uuid) SET search_path = public;
ALTER FUNCTION public.use_invite_code(text, uuid) SET search_path = public;
ALTER FUNCTION public.global_test_access_override() SET search_path = public;
