
DROP VIEW IF EXISTS public.research_topic_metrics;
DROP VIEW IF EXISTS public.research_user_metrics;

CREATE OR REPLACE VIEW public.research_user_metrics AS
WITH pre_tests AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    CASE WHEN total_questions > 0 
      THEN round((score::numeric / total_questions) * 100, 1) 
      ELSE NULL END AS pre_score_pct
  FROM user_tests
  WHERE test_type = 'pre' 
    AND completed_at IS NOT NULL 
    AND score IS NOT NULL AND total_questions IS NOT NULL AND total_questions > 0
    AND score <= total_questions
  ORDER BY user_id, created_at ASC
),
post_tests AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    CASE WHEN total_questions > 0 
      THEN round((score::numeric / total_questions) * 100, 1) 
      ELSE NULL END AS post_score_pct
  FROM user_tests
  WHERE test_type = 'post' 
    AND completed_at IS NOT NULL 
    AND score IS NOT NULL AND total_questions IS NOT NULL AND total_questions > 0
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
    count(*) FILTER (WHERE test_type = 'practice' OR test_type IS NULL) AS practice_attempts,
    sum(CASE WHEN score IS NULL OR score <= total_questions THEN total_questions ELSE 0 END) AS total_questions_answered,
    sum(CASE WHEN time_taken_seconds > 0 THEN time_taken_seconds ELSE 0 END) AS total_time_seconds,
    CASE WHEN sum(CASE WHEN time_taken_seconds > 0 THEN total_questions ELSE 0 END) > 0
      THEN round(
        sum(CASE WHEN time_taken_seconds > 0 THEN time_taken_seconds ELSE 0 END)::numeric 
        / sum(CASE WHEN time_taken_seconds > 0 THEN total_questions ELSE 0 END), 1)
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
  uts.total_time_seconds,
  uts.practice_attempts,
  COALESCE(ai.ai_plan_count, 0) AS ai_usage_count
FROM profiles p
LEFT JOIN pre_tests pre ON pre.user_id = p.id
LEFT JOIN post_tests post ON post.user_id = p.id
LEFT JOIN user_accuracy ua ON ua.user_id = p.id
LEFT JOIN user_test_stats uts ON uts.user_id = p.id
LEFT JOIN ai_usage ai ON ai.user_id = p.id
WHERE uts.total_tests > 0;

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

ALTER VIEW public.research_user_metrics SET (security_invoker = on);
ALTER VIEW public.research_topic_metrics SET (security_invoker = on);
