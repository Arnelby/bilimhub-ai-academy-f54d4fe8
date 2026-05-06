REVOKE EXECUTE ON FUNCTION public.global_test_access_override() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.global_test_access_override() FROM anon;
GRANT EXECUTE ON FUNCTION public.global_test_access_override() TO authenticated;