# BilimHub — Research Data Executive Summary

## Обзор схемы
- **Всего таблиц в `public`:** 32 (включая 3 backup и несколько служебных).
- **Используется в исследовании напрямую:** 14 таблиц (Critical).
- **Supporting:** 12 таблиц (контент, нормализация, конфигурация).
- **Системные/не используются:** 6 (бэкапы, rate-limit, invite-инфраструктура).

## Критические таблицы (короткий список)
`profiles`, `beta_whitelist`, `user_tests`, `question_attempts`, `user_answers`,
`practice_sessions`, `practice_responses`, `topic_mastery_state`, `mistake_queue`,
`spaced_repetition`, `ai_chat_messages`, `ai_learning_plans_v2`, `user_sessions`,
`user_activity`.

## Группы эксперимента
- Источник истины: `beta_whitelist.group_type` (enum `experiment_group`).
- Зеркало: `profiles.group_type` (синхронизируется триггером `sync_participant_id`).
- Значения: `ai`, `control`, `showcase`. Анализ обычно: AI vs Control (n≈5 в текущей закрытой бете).

## Основные исследовательские переменные
- **Достижения:** `pre_test_score`, `post_test_score`, `learning_gain`, `normalized_gain` (Hake's g).
- **Удержание:** `retention_days`, `total_platform_days`, `total_logins`, `total_time_spent`.
- **Engagement:** `practice_sessions_count`, `total_practice_questions`, `practice_accuracy`.
- **Обучаемость:** `weak_topics_count`, `mastered_topics_count`, `completion_rate`.
- **Поведение в ошибках:** `mistake_count`, `review_sessions_count`, `spaced_repetition_completed`.
- **AI-специфичные:** `ai_messages_count`, `ai_tutor_sessions`.

## Рекомендации по анализу
1. **Очистка данных:** фильтровать по `is_reliable = true` и `data_version = 'v2'` в `practice_responses`, `question_attempts`, `user_answers`.
2. **Нормализация тем:** использовать `topic_normalized` (через `normalize_topic()` / `topic_canonical_map`) — иначе появятся дубли тем на разных языках.
3. **Score нормализация:** в `user_tests.score` встречаются и проценты, и абсолютные значения; нормализовать как в `get_global_leaderboard`.
4. **Маленькая выборка (n=5):** использовать непараметрические тесты (Wilcoxon, Mann–Whitney) + эффект-сайз (Cliff's δ, Hedges' g).
5. **Идентификаторы для статьи:** только `participant_id` (AI-XXX/CTRL-XXX). Не публиковать email и full_name.

## Пробелы (требует дополнения перед публикацией)
- ⚠ Нет таблицы `video_events` → метрики просмотра видео восстанавливаются только косвенно.
- ⚠ Нет `user_feedback`/`surveys` → нет `survey_satisfaction`, `survey_nps`.
- ⚠ `user_tests` и `user_learning_state` присутствуют в коде/функциях, но не в выборке `<supabase-tables>` — перед экспортом подтвердить их колонки `\d`.

## Артефакты
- `research/data_dictionary.md` — полный словарь полей.
- `research/research_tables.md` — таблицы по приоритетам.
- `research/research_variables.md` — формулы переменных.
- `research/analysis_queries.sql` — view `research_participant_metrics` + 8 анализов.
- `research/er_diagram.md` — Mermaid ER-схема.
- `research/codebook.xlsx` — табличный codebook для экспорта.
