
-- 1. Create experiment group ENUM
CREATE TYPE public.experiment_group AS ENUM ('ai', 'control', 'showcase');

-- 2. Convert profiles.group_type from text to ENUM
ALTER TABLE public.profiles 
  ALTER COLUMN group_type DROP DEFAULT;
ALTER TABLE public.profiles
  ALTER COLUMN group_type TYPE public.experiment_group
  USING CASE 
    WHEN group_type = 'control' THEN 'ai'::experiment_group
    WHEN group_type = 'ai' THEN 'ai'::experiment_group
    WHEN group_type = 'showcase' THEN 'showcase'::experiment_group
    ELSE 'ai'::experiment_group
  END;
ALTER TABLE public.profiles
  ALTER COLUMN group_type SET DEFAULT 'ai'::experiment_group;

-- 3. Add group_type to beta_whitelist
ALTER TABLE public.beta_whitelist
  ADD COLUMN group_type public.experiment_group NOT NULL DEFAULT 'ai'::experiment_group;

-- 4. Backfill old user_tests missing test_type and attempt_number
WITH ranked AS (
  SELECT id, user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY COALESCE(started_at, created_at)) AS rn
  FROM user_tests
  WHERE attempt_number IS NULL
)
UPDATE user_tests ut
SET 
  attempt_number = r.rn,
  test_type = CASE WHEN r.rn = 1 THEN 'pre' ELSE 'post' END
FROM ranked r
WHERE ut.id = r.id;

-- 5. Recreate research_user_metrics view with group_type
DROP VIEW IF EXISTS public.research_user_metrics;
CREATE OR REPLACE VIEW public.research_user_metrics AS
WITH pre_tests AS (
  SELECT DISTINCT ON (user_id) user_id, score, total_questions
  FROM user_tests
  WHERE test_type = 'pre' AND score IS NOT NULL AND total_questions IS NOT NULL AND total_questions > 0
    AND score <= total_questions
  ORDER BY user_id, COALESCE(started_at, created_at) ASC
),
post_tests AS (
  SELECT DISTINCT ON (user_id) user_id, score, total_questions
  FROM user_tests
  WHERE test_type = 'post' AND score IS NOT NULL AND total_questions IS NOT NULL AND total_questions > 0
    AND score <= total_questions
  ORDER BY user_id, COALESCE(started_at, created_at) DESC
),
user_accuracy AS (
  SELECT user_id,
    COUNT(*) AS total_questions_answered,
    ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 1) AS accuracy_pct,
    ROUND(AVG(NULLIF(time_spent_seconds, 0))::numeric, 1) AS avg_time_per_question
  FROM question_attempts
  GROUP BY user_id
),
practice_stats AS (
  SELECT user_id, COUNT(*) AS practice_attempts
  FROM practice_questions
  GROUP BY user_id
),
ai_stats AS (
  SELECT user_id, COUNT(*) AS ai_usage_count
  FROM ai_chat_messages WHERE role = 'user'
  GROUP BY user_id
)
SELECT
  p.id AS user_id,
  COALESCE(p.full_name, p.name, p.id::text) AS user_name,
  p.group_type::text AS group_type,
  CASE WHEN pre.total_questions > 0 THEN ROUND((pre.score::numeric / pre.total_questions) * 100, 1) END AS pre_score_pct,
  CASE WHEN post.total_questions > 0 THEN ROUND((post.score::numeric / post.total_questions) * 100, 1) END AS post_score_pct,
  CASE WHEN pre.total_questions > 0 AND post.total_questions > 0 THEN
    ROUND((post.score::numeric / post.total_questions) * 100, 1) - ROUND((pre.score::numeric / pre.total_questions) * 100, 1)
  END AS improvement,
  (SELECT COUNT(*) FROM user_tests WHERE user_id = p.id AND completed_at IS NOT NULL)::int AS total_tests,
  ua.total_questions_answered::int,
  ua.accuracy_pct,
  ua.avg_time_per_question,
  COALESCE(ps.practice_attempts, 0)::int AS practice_attempts,
  COALESCE(ai.ai_usage_count, 0)::int AS ai_usage_count,
  (SELECT COUNT(*) FROM user_sessions WHERE user_id = p.id)::int AS total_sessions,
  (SELECT SUM(COALESCE(time_taken_seconds, 0)) FROM user_tests WHERE user_id = p.id)::int AS total_time_seconds
FROM profiles p
LEFT JOIN pre_tests pre ON pre.user_id = p.id
LEFT JOIN post_tests post ON post.user_id = p.id
LEFT JOIN user_accuracy ua ON ua.user_id = p.id
LEFT JOIN practice_stats ps ON ps.user_id = p.id
LEFT JOIN ai_stats ai ON ai.user_id = p.id;

-- 6. Recreate research_topic_metrics view
DROP VIEW IF EXISTS public.research_topic_metrics;
CREATE OR REPLACE VIEW public.research_topic_metrics AS
SELECT
  qa.user_id,
  COALESCE(p.full_name, p.name, p.id::text) AS user_name,
  p.group_type::text AS group_type,
  qa.topic,
  COUNT(*) AS attempts,
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) AS correct,
  ROUND(AVG(CASE WHEN qa.is_correct THEN 100.0 ELSE 0.0 END), 1) AS accuracy_pct
FROM question_attempts qa
JOIN profiles p ON p.id = qa.user_id
WHERE qa.topic IS NOT NULL AND qa.topic != ''
GROUP BY qa.user_id, p.full_name, p.name, p.id, p.group_type, qa.topic;
