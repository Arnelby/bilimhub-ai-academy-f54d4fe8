# Research Table Mapping — BilimHub

Реальные таблицы из схемы Supabase, сгруппированные по роли в исследовании.

## 🔴 Critical Research Tables
Используются напрямую в основной статистике (independent/dependent variables).

| Таблица | Роль в исследовании |
|---|---|
| `profiles` | participant identity, group_type, retention |
| `beta_whitelist` | источник истины: group_type, participant_id |
| `user_tests` | результаты pre/mid/post тестов (score, total_questions, completed_at, answers) |
| `question_attempts` | per-question accuracy и time в тестах (SSoT) |
| `user_answers` | дублирующий агрегат ответов по тестам |
| `practice_sessions` | engagement: количество и длительность сессий |
| `practice_responses` | per-question practice accuracy (SSoT) |
| `topic_mastery_state` | weak/mastered/medium классификация по темам |
| `mistake_queue` | mistake_count, review behavior |
| `spaced_repetition` | spaced_repetition_completed |
| `ai_chat_messages` | использование AI-тьютора (AI-группа) |
| `ai_learning_plans_v2` | наличие и содержание AI-плана |
| `user_sessions` | total_time_spent, retention_days, total_logins |
| `user_activity` | streak, daily completion |

## 🟠 Supporting Tables
Используются для интерпретации, нормализации, контента.

| Таблица | Роль |
|---|---|
| `tests` | метаданные тестов |
| `topics` | каноническая иерархия тем |
| `topic_canonical_map` | нормализация написаний тем |
| `math_questions` | контент Variants 1 & 3 (Comparison) |
| `math_test_questions` | контент Variants 2 & 4 (MCQ) |
| `practice_questions` | банк вопросов практики |
| `test_access` | фильтр доступа по participant_id |
| `ai_mistake_explanations` | контекст AI-объяснений (AI only) |
| `learning_sessions` | направленные занятия |
| `user_learning_state` | деривированное состояние (weak/phase) |
| `ai_recommendations` | legacy-рекомендации |
| `ai_request_logs` | стоимость/нагрузка AI (опционально) |
| `user_diagnostic_profile` | ковариаты (стиль, цели, уровень) |
| `user_achievements` | engagement proxy |
| `lessons`, `questions`, `question_explanations` | контент уроков |

## ⚪ System / Not Used in Paper
| Таблица | Причина |
|---|---|
| `invite_codes`, `beta_access` | onboarding |
| `rate_limits` | служебная |
| `pq_explanation_staging` | временная админская |
| `practice_questions_backup` | бэкап |
| `practice_responses_backup` | бэкап |
| `topic_mastery_state_backup` | бэкап |
| `practice_session_questions` | вспомогательная связь |

## Отсутствующие концепции
Эти концепции упомянуты в задаче, но **в реальной схеме отсутствуют**:
- `video_tracking` — нет; видео-активность можно частично восстановить через `spaced_repetition.linked_video_id`, `user_lesson_progress` (если используется), либо логически — отсутствует SSoT.
- `user_feedback`, `survey_satisfaction`, `survey_nps` — нет таблицы. Требуется добавление перед публикацией статьи.
- Отдельной `test_attempts` нет — её роль выполняет `question_attempts.test_attempt_id` + `user_tests`.

