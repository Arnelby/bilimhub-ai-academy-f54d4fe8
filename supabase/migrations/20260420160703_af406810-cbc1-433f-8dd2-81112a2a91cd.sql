-- Add mid1_score_pct column (Math Test Variant 2) to research_user_metrics view
DROP VIEW IF EXISTS public.research_user_metrics;

CREATE VIEW public.research_user_metrics
WITH (security_invoker=true) AS
WITH pre_tests AS (
  SELECT DISTINCT ON (user_tests.user_id) user_tests.user_id,
    user_tests.score,
    user_tests.total_questions
  FROM user_tests
  WHERE user_tests.test_type = 'pre'::text
    AND user_tests.score IS NOT NULL
    AND user_tests.total_questions IS NOT NULL
    AND user_tests.total_questions > 0
    AND user_tests.score <= user_tests.total_questions
  ORDER BY user_tests.user_id, COALESCE(user_tests.started_at, user_tests.created_at)
),
mid1_tests AS (
  -- Best attempt at Math Variant 2 (test_id = 00000000-0000-0000-0000-000000000002)
  SELECT DISTINCT ON (user_tests.user_id) user_tests.user_id,
    user_tests.score,
    user_tests.total_questions
  FROM user_tests
  WHERE user_tests.test_id = '00000000-0000-0000-0000-000000000002'::uuid
    AND user_tests.completed_at IS NOT NULL
    AND user_tests.score IS NOT NULL
    AND user_tests.total_questions IS NOT NULL
    AND user_tests.total_questions > 0
    AND user_tests.score <= user_tests.total_questions
  ORDER BY user_tests.user_id, (user_tests.score::numeric / user_tests.total_questions::numeric) DESC, COALESCE(user_tests.completed_at, user_tests.created_at) DESC
),
post_tests AS (
  SELECT DISTINCT ON (user_tests.user_id) user_tests.user_id,
    user_tests.score,
    user_tests.total_questions
  FROM user_tests
  WHERE user_tests.test_type = 'post'::text
    AND user_tests.score IS NOT NULL
    AND user_tests.total_questions IS NOT NULL
    AND user_tests.total_questions > 0
    AND user_tests.score <= user_tests.total_questions
  ORDER BY user_tests.user_id, COALESCE(user_tests.started_at, user_tests.created_at) DESC
),
user_accuracy AS (
  SELECT question_attempts.user_id,
    count(*) AS total_questions_answered,
    round(avg(CASE WHEN question_attempts.is_correct THEN 100.0 ELSE 0.0 END), 1) AS accuracy_pct,
    round(avg(NULLIF(question_attempts.time_spent_seconds, 0)), 1) AS avg_time_per_question
  FROM question_attempts
  GROUP BY question_attempts.user_id
),
practice_stats AS (
  SELECT practice_questions.user_id, count(*) AS practice_attempts
  FROM practice_questions
  GROUP BY practice_questions.user_id
),
ai_stats AS (
  SELECT ai_chat_messages.user_id, count(*) AS ai_usage_count
  FROM ai_chat_messages
  WHERE ai_chat_messages.role = 'user'::text
  GROUP BY ai_chat_messages.user_id
)
SELECT p.id AS user_id,
  COALESCE(p.full_name, p.name, p.id::text) AS user_name,
  p.group_type::text AS group_type,
  CASE WHEN pre.total_questions > 0 THEN round(pre.score::numeric / pre.total_questions::numeric * 100::numeric, 1) ELSE NULL::numeric END AS pre_score_pct,
  CASE WHEN mid1.total_questions > 0 THEN round(mid1.score::numeric / mid1.total_questions::numeric * 100::numeric, 1) ELSE NULL::numeric END AS mid1_score_pct,
  CASE WHEN post.total_questions > 0 THEN round(post.score::numeric / post.total_questions::numeric * 100::numeric, 1) ELSE NULL::numeric END AS post_score_pct,
  CASE WHEN pre.total_questions > 0 AND post.total_questions > 0
    THEN round(post.score::numeric / post.total_questions::numeric * 100::numeric, 1) - round(pre.score::numeric / pre.total_questions::numeric * 100::numeric, 1)
    ELSE NULL::numeric END AS improvement,
  ((SELECT count(*) FROM user_tests WHERE user_tests.user_id = p.id AND user_tests.completed_at IS NOT NULL))::integer AS total_tests,
  ua.total_questions_answered::integer AS total_questions_answered,
  ua.accuracy_pct,
  ua.avg_time_per_question,
  COALESCE(ps.practice_attempts, 0::bigint)::integer AS practice_attempts,
  COALESCE(ai.ai_usage_count, 0::bigint)::integer AS ai_usage_count,
  ((SELECT count(*) FROM user_sessions WHERE user_sessions.user_id = p.id))::integer AS total_sessions,
  ((SELECT sum(COALESCE(user_tests.time_taken_seconds, 0)) FROM user_tests WHERE user_tests.user_id = p.id))::integer AS total_time_seconds
FROM profiles p
  LEFT JOIN pre_tests pre ON pre.user_id = p.id
  LEFT JOIN mid1_tests mid1 ON mid1.user_id = p.id
  LEFT JOIN post_tests post ON post.user_id = p.id
  LEFT JOIN user_accuracy ua ON ua.user_id = p.id
  LEFT JOIN practice_stats ps ON ps.user_id = p.id
  LEFT JOIN ai_stats ai ON ai.user_id = p.id;