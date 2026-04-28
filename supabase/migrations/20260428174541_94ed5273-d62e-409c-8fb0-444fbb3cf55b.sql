CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  tests_completed integer,
  accuracy numeric,
  ranking_score numeric,
  rank_position bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      ut.user_id,
      COUNT(*)::int AS tests_completed,
      CASE
        WHEN SUM(COALESCE(ut.total_questions, 30)) > 0 THEN
          ROUND(
            (SUM(
              CASE
                WHEN ut.score > COALESCE(ut.total_questions, 30)
                  THEN (ut.score::numeric / 100) * COALESCE(ut.total_questions, 30)
                ELSE ut.score::numeric
              END
            ) / SUM(COALESCE(ut.total_questions, 30))) * 100,
            1
          )
        ELSE 0
      END AS accuracy
    FROM public.user_tests ut
    WHERE ut.completed_at IS NOT NULL
    GROUP BY ut.user_id
    HAVING COUNT(*) > 0
  ),
  scored AS (
    SELECT
      p.id AS user_id,
      COALESCE(p.full_name, p.name, 'Студент') AS display_name,
      p.avatar_url,
      s.tests_completed,
      s.accuracy,
      ROUND((s.accuracy * 0.7) + (LEAST(s.tests_completed, 100) * 0.3), 2) AS ranking_score
    FROM stats s
    JOIN public.profiles p ON p.id = s.user_id
  )
  SELECT
    sc.user_id,
    sc.display_name,
    sc.avatar_url,
    sc.tests_completed,
    sc.accuracy,
    sc.ranking_score,
    RANK() OVER (ORDER BY sc.ranking_score DESC, sc.accuracy DESC, sc.tests_completed DESC) AS rank_position
  FROM scored sc
  ORDER BY rank_position ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard() TO authenticated;