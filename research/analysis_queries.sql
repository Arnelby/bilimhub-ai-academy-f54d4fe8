-- =====================================================================
-- BilimHub — Research Analysis Queries
-- На реальной схеме Supabase. Запускать в SQL Editor.
-- Перед использованием подставить реальные UUID тестов (pre/mid1/mid2/post).
-- =====================================================================

-- ---------- 0. Participant-level базовая выборка ----------
CREATE OR REPLACE VIEW research_participant_metrics AS
WITH pid AS (
  SELECT p.id              AS user_id,
         COALESCE(bw.participant_id, p.participant_id)        AS participant_id,
         COALESCE(bw.group_type::text, p.group_type::text)    AS group_type,
         COALESCE(p.full_name, p.name)                        AS display_name,
         p.created_at                                         AS enrolled_at,
         p.last_activity_date
  FROM profiles p
  LEFT JOIN beta_whitelist bw ON LOWER(bw.email) = LOWER(p.email) AND bw.is_active
),
sess AS (
  SELECT user_id,
         COUNT(*)                                             AS total_logins,
         COUNT(DISTINCT date_trunc('day', session_start))     AS total_platform_days,
         SUM(COALESCE(duration_seconds, 0))                   AS total_time_spent,
         EXTRACT(DAY FROM (MAX(session_start) - MIN(session_start)))::int AS retention_days
  FROM user_sessions
  GROUP BY user_id
),
tests AS (
  SELECT user_id,
         MAX(CASE WHEN test_id::text = '<PRE_TEST_ID>'  THEN score END) AS pre_test_score,
         MAX(CASE WHEN test_id::text = '<MID1_TEST_ID>' THEN score END) AS mid1_score,
         MAX(CASE WHEN test_id::text = '<MID2_TEST_ID>' THEN score END) AS mid2_score,
         MAX(CASE WHEN test_id::text = '<POST_TEST_ID>' THEN score END) AS post_test_score
  FROM user_tests
  WHERE completed_at IS NOT NULL
  GROUP BY user_id
),
prac AS (
  SELECT s.user_id,
         COUNT(DISTINCT s.id)                                              AS practice_sessions_count,
         COUNT(r.id)                                                       AS total_practice_questions,
         AVG(CASE WHEN r.is_correct THEN 1.0 ELSE 0.0 END)                 AS practice_accuracy
  FROM practice_sessions s
  LEFT JOIN practice_responses r ON r.session_id = s.id
  GROUP BY s.user_id
),
mistakes AS (
  SELECT user_id,
         COUNT(*)                                          AS mistake_count,
         COUNT(*) FILTER (WHERE resolved)                  AS review_sessions_count
  FROM mistake_queue
  GROUP BY user_id
),
sr AS (
  SELECT user_id,
         COUNT(*) FILTER (WHERE status = 'mastered' OR success_streak >= 3) AS spaced_repetition_completed
  FROM spaced_repetition
  GROUP BY user_id
),
ai AS (
  SELECT user_id,
         COUNT(*) FILTER (WHERE role = 'user') AS ai_messages_count,
         COUNT(DISTINCT date_trunc('hour', created_at)) AS ai_tutor_sessions
  FROM ai_chat_messages
  GROUP BY user_id
),
topics AS (
  SELECT user_id,
         COUNT(*) FILTER (WHERE status = 'weak')     AS weak_topics_count,
         COUNT(*) FILTER (WHERE status = 'mastered') AS mastered_topics_count,
         COUNT(*)                                    AS total_topics_touched
  FROM topic_mastery_state
  GROUP BY user_id
)
SELECT pid.participant_id, pid.user_id, pid.group_type, pid.display_name,
       pid.enrolled_at, pid.last_activity_date,
       t.pre_test_score, t.mid1_score, t.mid2_score, t.post_test_score,
       (t.post_test_score - t.pre_test_score) AS learning_gain,
       CASE WHEN t.pre_test_score IS NOT NULL AND t.pre_test_score < 100
            THEN (t.post_test_score - t.pre_test_score)::numeric / NULLIF(100 - t.pre_test_score, 0)
       END AS normalized_gain,
       sess.total_logins, sess.total_platform_days, sess.total_time_spent, sess.retention_days,
       prac.practice_sessions_count, prac.total_practice_questions, prac.practice_accuracy,
       mistakes.mistake_count, mistakes.review_sessions_count,
       sr.spaced_repetition_completed,
       ai.ai_messages_count, ai.ai_tutor_sessions,
       topics.weak_topics_count, topics.mastered_topics_count,
       CASE WHEN topics.total_topics_touched > 0
            THEN topics.mastered_topics_count::numeric / topics.total_topics_touched END AS completion_rate
FROM pid
LEFT JOIN sess     ON sess.user_id     = pid.user_id
LEFT JOIN tests t  ON t.user_id        = pid.user_id
LEFT JOIN prac     ON prac.user_id     = pid.user_id
LEFT JOIN mistakes ON mistakes.user_id = pid.user_id
LEFT JOIN sr       ON sr.user_id       = pid.user_id
LEFT JOIN ai       ON ai.user_id       = pid.user_id
LEFT JOIN topics   ON topics.user_id   = pid.user_id
WHERE pid.participant_id IS NOT NULL;

-- ---------- 1. AI vs Control ----------
SELECT group_type,
       COUNT(*)                          AS n,
       AVG(pre_test_score)               AS pre_mean,
       AVG(post_test_score)              AS post_mean,
       AVG(learning_gain)                AS gain_mean,
       STDDEV(learning_gain)             AS gain_sd,
       AVG(normalized_gain)              AS norm_gain_mean,
       AVG(practice_accuracy)            AS practice_acc_mean,
       AVG(total_time_spent)/60.0        AS minutes_mean
FROM research_participant_metrics
WHERE group_type IN ('ai','control')
GROUP BY group_type;

-- ---------- 2. Pre / Post improvement ----------
SELECT participant_id, group_type,
       pre_test_score, post_test_score,
       learning_gain, normalized_gain
FROM research_participant_metrics
WHERE pre_test_score IS NOT NULL AND post_test_score IS NOT NULL
ORDER BY group_type, learning_gain DESC;

-- ---------- 3. Retention ----------
SELECT group_type,
       AVG(retention_days)       AS avg_retention_days,
       AVG(total_platform_days)  AS avg_active_days,
       AVG(total_logins)         AS avg_logins
FROM research_participant_metrics
GROUP BY group_type;

-- ---------- 4. Practice engagement ----------
SELECT group_type,
       AVG(practice_sessions_count)    AS sessions_mean,
       AVG(total_practice_questions)   AS questions_mean,
       AVG(practice_accuracy)          AS acc_mean
FROM research_participant_metrics
GROUP BY group_type;

-- ---------- 5. AI usage (only AI group meaningful) ----------
SELECT participant_id, ai_messages_count, ai_tutor_sessions,
       learning_gain, post_test_score
FROM research_participant_metrics
WHERE group_type = 'ai'
ORDER BY ai_messages_count DESC;

-- ---------- 6. Video usage (partial — uses linked_video_id) ----------
SELECT sr.user_id,
       COUNT(DISTINCT sr.linked_video_id) AS distinct_videos_linked
FROM spaced_repetition sr
WHERE sr.linked_video_id IS NOT NULL
GROUP BY sr.user_id;

-- ---------- 7. Weak topics analysis ----------
SELECT topic_normalized,
       COUNT(*) FILTER (WHERE status = 'weak')     AS n_weak,
       COUNT(*) FILTER (WHERE status = 'mastered') AS n_mastered,
       AVG(accuracy)                               AS avg_accuracy
FROM topic_mastery_state
GROUP BY topic_normalized
ORDER BY n_weak DESC;

-- ---------- 8. Correlations (Pearson via corr()) ----------
SELECT
  corr(ai_messages_count::numeric, learning_gain::numeric)        AS r_ai_msgs_gain,
  corr(practice_accuracy::numeric, learning_gain::numeric)        AS r_pracc_gain,
  corr(total_time_spent::numeric, learning_gain::numeric)         AS r_time_gain,
  corr(mastered_topics_count::numeric, post_test_score::numeric)  AS r_mastered_post
FROM research_participant_metrics
WHERE group_type IN ('ai','control');
