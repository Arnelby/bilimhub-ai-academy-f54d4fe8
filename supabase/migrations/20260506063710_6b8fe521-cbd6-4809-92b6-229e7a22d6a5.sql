REVOKE ALL ON FUNCTION public.global_test_access_override() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.global_test_access_override() FROM anon;
GRANT EXECUTE ON FUNCTION public.global_test_access_override() TO authenticated;

REVOKE ALL ON FUNCTION public.can_open_math_test(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_open_math_test(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_open_math_test(integer) TO authenticated;