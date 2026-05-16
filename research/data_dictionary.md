# BilimHub — Data Dictionary

Источник: реальная схема Supabase/PostgreSQL проекта BilimHub (см. `<supabase-tables>` и `<db-functions>`).
Только существующие таблицы. Ничего не выдумано.

Приоритеты:
- **Critical** — напрямую используется в исследовательской выборке/анализе
- **Important** — используется для интерпретации/связи
- **Optional** — может пригодиться для дополнительных метрик
- **Not Used** — техническое/служебное

---

## 1. profiles
**Назначение:** профиль пользователя; связь user.id ↔ participant_id (через триггер `sync_participant_id`).
**Используется в исследовании:** Да
**Приоритет:** Critical

| Колонка | Тип | Nullable | PK/FK | Описание | Пример | Использование в анализе |
|---|---|---|---|---|---|---|
| id | uuid | No | PK (auth.users.id) | ID пользователя | `7f3...` | join-ключ ко всем таблицам |
| participant_id | text | Yes | — | Исследовательский ID (CTRL-XXX, AI-XXX) | `AI-007` | основной идентификатор участника |
| group_type | experiment_group | Yes | — | Группа эксперимента | `ai` / `control` / `showcase` | независимая переменная |
| full_name | text | Yes | — | Полное имя | `Айгерим Б.` | атрибуция, демография |
| name | text | Yes | — | Короткое имя | `Айгерим` | fallback для отображения |
| email | text | Yes | — | Email | `a@x.kg` | связь с beta_whitelist |
| language_preference | text | Yes | — | Язык UI | `ru` | контроль интерпретации |
| theme_preference | text | Yes | — | Тема | `light` | — |
| points | int | Yes | — | Геймификация | 120 | engagement proxy |
| streak | int | Yes | — | Серия дней | 5 | retention proxy |
| level | int | Yes | — | Уровень | 2 | engagement proxy |
| leaderboard_visible | bool | Yes | — | Видимость в рейтинге | true | — |
| last_activity_date | date | Yes | — | Последняя активность | `2026-05-15` | retention |
| avatar_url | text | Yes | — | Аватар | — | — |
| created_at | timestamptz | Yes | — | Регистрация | — | baseline |
| updated_at | timestamptz | Yes | — | Обновление | — | — |

---

## 2. beta_whitelist
**Назначение:** распределение участников по группам, invite-доступ.
**Используется в исследовании:** Да
**Приоритет:** Critical

| Колонка | Тип | Nullable | PK/FK | Описание | Пример |
|---|---|---|---|---|---|
| id | uuid | No | PK | — | — |
| email | text | No | — | Email участника | `a@x.kg` |
| invite_code | text | No | — | Код доступа | `KG-12AB` |
| participant_id | text | Yes | — | Исследовательский ID | `AI-007` |
| group_type | experiment_group | No | — | Группа (источник истины) | `ai` |
| is_active | bool | Yes | — | Активен | true |
| used_at | timestamptz | Yes | — | Время активации | — |
| created_at | timestamptz | Yes | — | — | — |
| notes | text | Yes | — | Заметки админа | — |

**Анализ:** источник истины для `group_type` и `participant_id` (синхронизируется в `profiles` триггером).

---

## 3. tests
**Назначение:** каталог тестов (pre, mid, post, диагностические).
**Используется в исследовании:** Да
**Приоритет:** Critical

| Колонка | Тип | Nullable | Описание |
|---|---|---|---|
| id | uuid | No | PK |
| title / title_ru / title_kg | text | — | Локализованные названия |
| subject | enum | No | Предмет |
| type | enum | No | Тип теста |
| duration_minutes | int | No | Лимит времени |
| is_ai_generated | bool | Yes | AI-сгенерирован |
| created_at | timestamptz | Yes | — |

---

## 4. user_tests *(используется RPC `get_global_leaderboard`; основная таблица результатов тестов; не показана в схеме напрямую — см. триггеры/функции)*
**Назначение:** результаты прохождения тестов участником.
**Используется в исследовании:** Да (Critical)

> ⚠️ Таблица не появилась в `<supabase-tables>`, но используется в `public.get_global_leaderboard`, `research_user_metrics`, и Cyrillic memory. Поля по контракту функции: `user_id`, `score`, `total_questions`, `completed_at`, `answers (jsonb)`. Перед научным экспортом — подтвердить колонки через `\d public.user_tests`.

---

## 5. question_attempts
**Назначение:** атомарная попытка ответа в рамках теста.
**Используется в исследовании:** Да
**Приоритет:** Critical (per-question analytics, SSoT для попыток в тестах)

| Колонка | Тип | Nullable | Описание | Использование |
|---|---|---|---|---|
| id | uuid | No | PK | — |
| user_id | uuid | No | — | join |
| participant_id | text | Yes | — | research key |
| test_attempt_id | uuid | No | — | группировка по попытке теста |
| question_id | text | No | — | join к math_questions/math_test_questions |
| topic | text | Yes | — | тема |
| difficulty | text | Yes | — | уровень |
| user_answer | text | Yes | — | ответ ученика |
| correct_answer | text | Yes | — | правильный |
| is_correct | bool | No | — | бинарная зависимая переменная |
| time_spent_seconds | int | Yes | — | скорость |
| data_version | text | No | — | версия инструмента (`v2`) |
| is_reliable | bool | No | — | флаг чистоты данных |
| created_at | timestamptz | No | — | — |

---

## 6. user_answers
**Назначение:** дополнительный лог ответов с уникальным ключом (user, test, question).
**Используется в исследовании:** Да
**Приоритет:** Important (агрегаты по тестам)

Колонки: `user_id, test_id, test_name, question_id, topic, selected_option, correct_option, is_correct, answered_at, data_version, is_reliable`.

---

## 7. practice_sessions
**Назначение:** сессия практики (engagement unit).
**Используется в исследовании:** Да
**Приоритет:** Critical

| Колонка | Тип | Описание |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | join |
| participant_id | text | research key |
| group_type | text | snapshot группы |
| practice_type | text | `general` / `weak_topic` |
| status | text | `active` / `completed` |
| num_tasks | int | объём сессии |
| num_correct | int | accuracy numerator |
| total_time_seconds | int | время |
| weak_topics | jsonb | целевые темы |
| started_at | timestamptz | — |
| ended_at | timestamptz | — |
| data_version, is_reliable | — | контроль качества |

---

## 8. practice_responses
**Назначение:** атомарный ответ в практике (SSoT для practice accuracy).
**Используется в исследовании:** Да
**Приоритет:** Critical

| Колонка | Тип | Описание |
|---|---|---|
| id | uuid | PK |
| session_id | uuid | → practice_sessions.id |
| user_id, participant_id | — | — |
| question_id, question_index | — | идентификация вопроса |
| topic, topic_normalized | text | темы (нормализованная — каноническая EN) |
| difficulty | text | — |
| question_data | jsonb | контент вопроса (snapshot) |
| user_answer, correct_answer | text | — |
| is_correct | bool | — |
| time_spent_seconds | int | — |
| data_version, is_reliable | — | — |
| created_at | timestamptz | — |

---

## 9. practice_questions
**Назначение:** банк вопросов для практики.
**Приоритет:** Important (контекст вопросов, не для статистики)

Поля: `id, topic, topic_normalized, question_type, question_data, correct_answer, difficulty, quality_status, correct_explanation, explanation_a..e, source, created_at`.

---

## 10. math_questions
**Назначение:** банк вопросов формата Comparison (Variants 1 и 3).
**Приоритет:** Important

Поля: `id, test_id, question_number, topic, instruction, column_a, column_b, option_c, option_d, correct_answer, correct_explanation, explanation_a..d`.

---

## 11. math_test_questions
**Назначение:** банк вопросов MCQ (Variants 2 и 4).
**Приоритет:** Important

Поля: `id, test_id, question_number, topic, question_type, column_a, column_b, options (jsonb), correct_answer, correct_explanation, explanation_a..e, instruction`.

---

## 12. topics
**Назначение:** каноническая иерархия тем.
**Приоритет:** Important

Поля: `id, title, title_ru, title_kg, subject, parent_topic_id, level, order_index, description, created_at`.

---

## 13. topic_canonical_map
**Назначение:** маппинг разных написаний темы → канонический EN-ярлык.
**Приоритет:** Important (нормализация в анализе)

Поля: `raw_topic, canonical_en, created_at`.

---

## 14. topic_mastery_state
**Назначение:** агрегированное состояние мастерства по теме.
**Используется в исследовании:** Да
**Приоритет:** Critical (mastered/weak topic counts)

| Колонка | Описание |
|---|---|
| user_id, topic, topic_normalized | ключи |
| total_attempts, correct_answers, accuracy | базовые метрики |
| status (enum topic_mastery_status) | `new/weak/medium/mastered` |
| consecutive_wrong | стрик ошибок |
| needs_lesson | флаг необходимости урока |
| last_lesson_watched_at | время урока |
| mastered_at | дата освоения |
| created_at, updated_at | — |

---

## 15. mistake_queue
**Назначение:** очередь повторного разбора ошибок.
**Используется в исследовании:** Да
**Приоритет:** Critical (mistake_count, review)

Поля: `user_id, question_id, topic, correct_streak, total_attempts, resolved, resolved_at, created_at, updated_at`.

---

## 16. spaced_repetition
**Назначение:** интервальное повторение по вопросам.
**Используется в исследовании:** Да
**Приоритет:** Critical

Поля: `user_id, question_id, topic, status, correct_streak, success_streak, fail_count, next_review_date, last_attempt_at, linked_lesson_id, linked_video_id`.

---

## 17. learning_sessions
**Назначение:** сессии направленного обучения (engagement).
**Приоритет:** Important

Поля: `user_id, topic, status, step, current_question_*, last_*_correct, questions_answered, correct_count, max_questions, started_at, paused_at, completed_at`.

---

## 18. user_learning_state *(используется в `recompute_learning_state`, не приведена в `<supabase-tables>`)*
**Назначение:** деривированное состояние ученика (weak/strong/phase).
**Приоритет:** Important

> Подтвердить структуру: `topic_stats jsonb, weak_topics jsonb, strong_topics jsonb, mastery_phase, phase_topic, phase_correct_streak, phase_attempts, next_action, next_reason, current_step, updated_at`.

---

## 19. ai_chat_messages
**Назначение:** лог сообщений AI-тьютора.
**Используется в исследовании:** Да (только для AI-группы)
**Приоритет:** Critical

Поля: `user_id, role, content, topic_context, created_at`.

---

## 20. ai_mistake_explanations
**Назначение:** кэш AI-объяснений ошибок (только для AI-группы).
**Приоритет:** Important

Поля: `question_id, user_answer, correct_answer, explanation, created_at`.

---

## 21. ai_recommendations
**Назначение:** рекомендации (legacy).
**Приоритет:** Optional

---

## 22. ai_learning_plans_v2
**Назначение:** структурированный план обучения для AI-группы.
**Приоритет:** Important

Поля: `user_id, participant_id, plan_data, daily_tasks, target_topics, mastery_goals, schedule, learning_strategy, predicted_timeline, ort_score_projection, mini_tests, is_active, generated_at, updated_at`.

---

## 23. ai_request_logs
**Назначение:** логи AI-запросов (мониторинг, антиспам).
**Приоритет:** Optional (для cost-аналитики)

Поля: `user_id, function_name, status, response_time_ms, error_message, created_at`.

---

## 24. user_achievements
**Назначение:** достижения (геймификация).
**Приоритет:** Optional

---

## 25. user_activity
**Назначение:** дневная активность.
**Приоритет:** Important (retention, daily_goal)

Поля: `user_id, last_active_date, streak, tasks_completed_today, daily_goal`.

---

## 26. user_sessions *(используется `useSessionTracking`, не приведена в `<supabase-tables>`)*
**Назначение:** heartbeat-сессии времени на платформе.
**Приоритет:** Critical (total_time_spent, retention_days)

Поля по контракту хука: `user_id, participant_id, session_start, session_end, duration_seconds`.

---

## 27. test_access
**Назначение:** управление доступом к тестам по participant_id.
**Приоритет:** Important (фильтр квалифицированных участников)

Поля: `participant_id, test_id, is_allowed, created_at, updated_at`.

---

## 28. user_diagnostic_profile
**Назначение:** профиль из диагностики (стиль обучения, цели).
**Приоритет:** Optional (ковариаты)

---

## 29. invite_codes / beta_access
**Назначение:** управление инвайтами.
**Приоритет:** Not Used (в анализе)

---

## 30. rate_limits, ai_chat_messages (служебные), pq_explanation_staging, *_backup, practice_session_questions, questions, lessons, question_explanations
**Приоритет:** Supporting / Not Used:
- `lessons`, `questions`, `topic_canonical_map` — справочники для интерпретации.
- `*_backup`, `pq_explanation_staging`, `rate_limits`, `beta_access`, `invite_codes` — служебные.

---

## RPC-функции для анализа

| Функция | Назначение |
|---|---|
| `recompute_learning_state(user_id)` | пересчёт mastery/weak/strong |
| `topic_classification(acc, attempts)` | new/weak/medium/mastered |
| `is_weak_topic`, `is_mastered_topic` | бинарные классификаторы |
| `normalize_topic(raw)` | канонизация темы |
| `get_global_leaderboard()` | рейтинг по `user_tests` |
| `get_practice_questions_v2(topic, difficulty, limit)` | детерминированная выборка |
| `check_rate_limit(...)` | anti-spam |
| `validate_whitelist_login`, `use_invite_code` | onboarding |

