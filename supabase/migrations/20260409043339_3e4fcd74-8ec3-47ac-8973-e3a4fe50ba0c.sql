
-- View 1: Per-user research metrics
CREATE OR REPLACE VIEW public.research_user_metrics AS
WITH pre_tests AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    score,
    total_questions,
    CASE WHEN total_questions > 0 
      THEN round((score::numeric / total_questions) * 100, 1) 
      ELSE 0 END AS pre_score_pct
  FROM user_tests
  WHERE test_type = 'pre' AND completed_at IS NOT NULL AND score IS NOT NULL
    AND score <= total_questions -- filter corrupted rows
  ORDER BY user_id, created_at ASC
),
post_tests AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    score,
    total_questions,
    CASE WHEN total_questions > 0 
      THEN round((score::numeric / total_questions) * 100, 1) 
      ELSE 0 END AS post_score_pct
  FROM user_tests
  WHERE test_type = 'post' AND completed_at IS NOT NULL AND score IS NOT NULL
    AND score <= total_questions
  ORDER BY user_id, created_at DESC
),
user_accuracy AS (
  SELECT 
    user_id,
    round(avg(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) AS accuracy_pct,
    count(*) AS total_question_attempts
  FROM question_attempts
  GROUP BY user_id
),
user_test_stats AS (
  SELECT 
    user_id,
    count(*) AS total_tests,
    count(*) FILTER (WHERE test_type IS NULL OR test_type = 'practice') AS practice_attempts,
    sum(total_questions) AS total_questions_answered,
    sum(time_taken_seconds) AS total_time_seconds,
    CASE WHEN sum(total_questions) > 0
      THEN round(sum(time_taken_seconds)::numeric / sum(total_questions), 1)
      ELSE NULL END AS avg_time_per_question
  FROM user_tests
  WHERE completed_at IS NOT NULL
  GROUP BY user_id
),
ai_usage AS (
  SELECT user_id, count(*) AS ai_plan_count
  FROM ai_learning_plans_v2
  GROUP BY user_id
)
SELECT 
  p.id AS user_id,
  COALESCE(p.full_name, p.name, p.id::text) AS user_name,
  p.group_type,
  pre.pre_score_pct,
  post.post_score_pct,
  CASE WHEN pre.pre_score_pct IS NOT NULL AND post.post_score_pct IS NOT NULL
    THEN post.post_score_pct - pre.pre_score_pct
    ELSE NULL END AS improvement,
  uts.total_tests,
  uts.total_questions_answered,
  ua.accuracy_pct,
  uts.avg_time_per_question,
  uts.practice_attempts,
  COALESCE(ai.ai_plan_count, 0) AS ai_usage_count,
  uts.total_time_seconds
FROM profiles p
LEFT JOIN pre_tests pre ON pre.user_id = p.id
LEFT JOIN post_tests post ON post.user_id = p.id
LEFT JOIN user_accuracy ua ON ua.user_id = p.id
LEFT JOIN user_test_stats uts ON uts.user_id = p.id
LEFT JOIN ai_usage ai ON ai.user_id = p.id
WHERE uts.total_tests > 0;

-- View 2: Per-user, per-topic accuracy
CREATE OR REPLACE VIEW public.research_topic_metrics AS
SELECT 
  qa.user_id,
  COALESCE(p.full_name, p.name, qa.user_id::text) AS user_name,
  qa.topic,
  count(*) AS attempts,
  sum(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) AS correct,
  round(avg(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) AS accuracy_pct
FROM question_attempts qa
LEFT JOIN profiles p ON p.id = qa.user_id
WHERE qa.topic IS NOT NULL
GROUP BY qa.user_id, p.full_name, p.name, qa.topic
ORDER BY qa.user_id, qa.topic;
