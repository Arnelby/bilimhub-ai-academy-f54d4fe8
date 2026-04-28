REVOKE EXECUTE ON FUNCTION public.get_global_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard() TO authenticated;