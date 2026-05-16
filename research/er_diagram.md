# BilimHub — ER Diagram (Research-relevant)

```mermaid
erDiagram
  PROFILES ||--o{ USER_SESSIONS : "user_id"
  PROFILES ||--o{ USER_TESTS : "user_id"
  PROFILES ||--o{ QUESTION_ATTEMPTS : "user_id"
  PROFILES ||--o{ USER_ANSWERS : "user_id"
  PROFILES ||--o{ PRACTICE_SESSIONS : "user_id"
  PROFILES ||--o{ MISTAKE_QUEUE : "user_id"
  PROFILES ||--o{ SPACED_REPETITION : "user_id"
  PROFILES ||--o{ TOPIC_MASTERY_STATE : "user_id"
  PROFILES ||--o{ AI_CHAT_MESSAGES : "user_id"
  PROFILES ||--o{ AI_LEARNING_PLANS_V2 : "user_id"
  PROFILES ||--o{ USER_ACTIVITY : "user_id"
  PROFILES ||--o{ USER_DIAGNOSTIC_PROFILE : "user_id"
  PROFILES ||--o{ USER_ACHIEVEMENTS : "user_id"

  BETA_WHITELIST ||--|| PROFILES : "email (SSoT for group_type, participant_id)"

  PRACTICE_SESSIONS ||--o{ PRACTICE_RESPONSES : "session_id"
  PRACTICE_SESSIONS ||--o{ PRACTICE_SESSION_QUESTIONS : "session_id"

  TESTS ||--o{ USER_TESTS : "test_id"
  TESTS ||--o{ MATH_QUESTIONS : "test_id"
  TESTS ||--o{ MATH_TEST_QUESTIONS : "test_id"

  TOPICS ||--o{ TOPIC_MASTERY_STATE : "topic"
  TOPIC_CANONICAL_MAP }o--o{ PRACTICE_RESPONSES : "topic normalization"

  USER_TESTS ||--o{ QUESTION_ATTEMPTS : "test_attempt_id"

  TEST_ACCESS }o--|| BETA_WHITELIST : "participant_id"
```

## Легенда исследовательских ролей

- 🔴 Critical: `profiles`, `beta_whitelist`, `user_tests`, `question_attempts`, `practice_sessions`, `practice_responses`, `topic_mastery_state`, `mistake_queue`, `spaced_repetition`, `ai_chat_messages`, `user_sessions`.
- 🟠 Supporting: `tests`, `topics`, `topic_canonical_map`, `math_questions`, `math_test_questions`, `practice_questions`, `learning_sessions`, `ai_learning_plans_v2`, `user_diagnostic_profile`, `user_activity`.
- ⚪ Not used / system: `invite_codes`, `beta_access`, `rate_limits`, `*_backup`, `pq_explanation_staging`.
