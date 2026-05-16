-- =====================================================================
-- BilimHub — research_participant_metrics
-- One row per study participant. Built ONLY on existing tables.
--
-- NOTE: replace <PRE_TEST_ID> / <MID1_TEST_ID> / <MID2_TEST_ID> /
--       <POST_TEST_ID> with real UUIDs from public.tests before running.
--
-- Missing in current schema (kept as NULL with explicit comment):
--   * video_views_count   — no video_events table. Approximated via
--                           DISTINCT spaced_repetition.linked_video_id.
--   * survey_satisfaction — no user_feedback / survey table yet.
-- =====================================================================

CREATE OR REPLACE VIEW public.research_participant_metrics AS
WITH pid AS (
  SELECT
    p.id                                                       AS user_id,
    COALESCE(bw.participant_id, p.participant_id)              AS participant_id,
    COALESCE(bw.group_type::text, p.group_type::text)          AS group_type,
    COALESCE(p.full_name, p.name, 'Студент')                   AS full_name,
    p.created_at                                               AS enrolled_at,
    p.last_activity_date
  FROM public.profiles p
  LEFT JOIN public.beta_whitelist bw
    ON LOWER(bw.email) = LOWER(p.email) AND bw.is_active
),
tests AS (
  SELECT
    user_id,
    MAX(CASE WHEN test_id::text = '<PRE_TEST_ID>'  THEN score END) AS pre_test_score,
    MAX(CASE WHEN test_id::text = '<MID1_TEST_ID>' THEN score END) AS mid1_score,
    MAX(CASE WHEN test_id::text = '<MID2_TEST_ID>' THEN score END) AS mid2_score,
    MAX(CASE WHEN test_id::text = '<POST_TEST_ID>' THEN score END) AS post_test_score
  FROM public.user_tests
  WHERE completed_at IS NOT NULL
  GROUP BY user_id
),
prac AS (
  SELECT
    s.user_id,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS practice_sessions_count,
    COUNT(r.id)                                                AS total_practice_questions,
    AVG(CASE WHEN r.is_correct THEN 1.0 ELSE 0.0 END)          AS practice_accuracy,
    SUM(COALESCE(s.total_time_seconds, 0))                     AS total_time_spent
  FROM public.practice_sessions s
  LEFT JOIN public.practice_responses r ON r.session_id = s.id
  GROUP BY s.user_id
),
topics AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE status = 'weak')     AS weak_topics_count,
    COUNT(*) FILTER (WHERE status = 'mastered') AS mastered_topics_count,
    COUNT(*)                                    AS total_topics_touched
  FROM public.topic_mastery_state
  GROUP BY user_id
),
ai AS (
  SELECT
    user_id,
    COUNT(*) FILTER (WHERE role = 'user') AS ai_messages_count
  FROM public.ai_chat_messages
  GROUP BY user_id
),
videos AS (
  -- Approximation: distinct video IDs linked via spaced repetition.
  SELECT
    user_id,
    COUNT(DISTINCT linked_video_id) AS video_views_count
  FROM public.spaced_repetition
  WHERE linked_video_id IS NOT NULL
  GROUP BY user_id
)
SELECT
  pid.participant_id,
  pid.full_name,
  pid.group_type,

  -- Test scores
  tests.pre_test_score,
  tests.mid1_score,
  tests.mid2_score,
  tests.post_test_score,

  -- Derived learning metrics
  (tests.post_test_score - tests.pre_test_score)                 AS learning_gain,
  CASE
    WHEN tests.pre_test_score IS NOT NULL
     AND tests.pre_test_score < 100
    THEN (tests.post_test_score - tests.pre_test_score)::numeric
         / NULLIF(100 - tests.pre_test_score, 0)
  END                                                            AS normalized_gain,

  -- Retention (days between enrollment and last activity)
  CASE
    WHEN pid.last_activity_date IS NOT NULL
    THEN (pid.last_activity_date - pid.enrolled_at::date)
  END                                                            AS retention_days,

  -- Practice engagement
  COALESCE(prac.practice_sessions_count, 0)                      AS practice_sessions_count,
  COALESCE(prac.total_practice_questions, 0)                     AS total_practice_questions,
  prac.practice_accuracy,

  -- Topic mastery
  COALESCE(topics.weak_topics_count, 0)                          AS weak_topics_count,
  COALESCE(topics.mastered_topics_count, 0)                      AS mastered_topics_count,

  -- Video usage (approximation — see header)
  COALESCE(videos.video_views_count, 0)                          AS video_views_count,

  -- AI chat usage
  COALESCE(ai.ai_messages_count, 0)                              AS ai_messages_count,

  -- Total time spent in practice (seconds)
  COALESCE(prac.total_time_spent, 0)                             AS total_time_spent,

  -- Completion rate = mastered / touched topics
  CASE
    WHEN COALESCE(topics.total_topics_touched, 0) > 0
    THEN topics.mastered_topics_count::numeric
         / topics.total_topics_touched
  END                                                            AS completion_rate,

  -- ⚠ MISSING in current schema (no survey table)
  NULL::numeric                                                  AS survey_satisfaction

FROM pid
LEFT JOIN tests  ON tests.user_id  = pid.user_id
LEFT JOIN prac   ON prac.user_id   = pid.user_id
LEFT JOIN topics ON topics.user_id = pid.user_id
LEFT JOIN ai     ON ai.user_id     = pid.user_id
LEFT JOIN videos ON videos.user_id = pid.user_id
WHERE pid.participant_id IS NOT NULL;

COMMENT ON VIEW public.research_participant_metrics IS
  'Participant-level research metrics for BilimHub. One row per beta participant. '
  'video_views_count is approximated via spaced_repetition.linked_video_id. '
  'survey_satisfaction is NULL until a user_feedback table is added.';
