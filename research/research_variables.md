# Research Variables Dictionary — BilimHub

Все переменные опираются на реально существующие таблицы. Где источник отсутствует — переменная помечена `⚠ MISSING`.

Уровни анализа:
- **P** = participant (одна строка на участника)
- **S** = session
- **Q** = question/attempt

---

### participant_id
- **Уровень:** P
- **Источник:** `beta_whitelist.participant_id` (primary), `profiles.participant_id` (mirror via trigger `sync_participant_id`)
- **Формула:** `COALESCE(bw.participant_id, p.participant_id)`
- **Описание:** Псевдонимизированный идентификатор участника (`AI-007`, `CTRL-012`).

### full_name
- **Уровень:** P
- **Источник:** `profiles.full_name` (fallback `profiles.name`)
- **Формула:** `COALESCE(full_name, name, 'Студент')`

### group_type
- **Уровень:** P
- **Источник:** `beta_whitelist.group_type` (SSoT) → `profiles.group_type`
- **Значения:** `ai` / `control` / `showcase`

### pre_test_score, mid1_score, mid2_score, post_test_score
- **Уровень:** P
- **Источник:** `user_tests`
- **SQL:**
```sql
SELECT user_id,
  MAX(score) FILTER (WHERE test_id = '<PRE_TEST_UUID>')   AS pre_test_score,
  MAX(score) FILTER (WHERE test_id = '<MID1_UUID>')        AS mid1_score,
  MAX(score) FILTER (WHERE test_id = '<MID2_UUID>')        AS mid2_score,
  MAX(score) FILTER (WHERE test_id = '<POST_TEST_UUID>')  AS post_test_score
FROM user_tests
WHERE completed_at IS NOT NULL
GROUP BY user_id;
```
- **Нормализация score → %:** при `score > total_questions` интерпретировать как %, иначе `score/total_questions*100`.

### learning_gain
- **Уровень:** P
- **Формула:** `post_test_score - pre_test_score`

### normalized_gain (Hake's g)
- **Уровень:** P
- **Формула:** `(post - pre) / (100 - pre)` при `pre < 100`, иначе NULL.

### total_platform_days
- **Уровень:** P
- **Источник:** `user_sessions`
- **SQL:** `COUNT(DISTINCT date_trunc('day', session_start))`

### retention_days
- **Уровень:** P
- **Формула:** `MAX(session_start) - MIN(session_start)` в днях.

### total_logins
- **Уровень:** P
- **Источник:** `user_sessions`
- **SQL:** `COUNT(*)`

### total_time_spent (sec)
- **Уровень:** P
- **Источник:** `user_sessions.duration_seconds`
- **SQL:** `SUM(duration_seconds)`

### practice_sessions_count
- **Уровень:** P
- **Источник:** `practice_sessions`
- **SQL:** `COUNT(*) FILTER (WHERE status = 'completed')`

### total_practice_questions
- **Уровень:** P
- **Источник:** `practice_responses`
- **SQL:** `COUNT(*)`

### practice_accuracy
- **Уровень:** P
- **Источник:** `practice_responses`
- **Формула:** `SUM(is_correct::int)::numeric / NULLIF(COUNT(*),0)`

### mistake_count
- **Уровень:** P
- **Источник:** `mistake_queue`
- **SQL:** `COUNT(*)` (общее) или `COUNT(*) FILTER (WHERE NOT resolved)` (активные)

### review_sessions_count
- **Уровень:** P
- **Источник:** `mistake_queue`
- **SQL:** `COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)`

### spaced_repetition_completed
- **Уровень:** P
- **Источник:** `spaced_repetition`
- **SQL:** `COUNT(*) FILTER (WHERE status = 'mastered' OR success_streak >= 3)`

### video_views_count ⚠ PARTIAL
- **Источник:** прямой таблицы нет. Аппрокс через `spaced_repetition.linked_video_id IS NOT NULL` или `last_lesson_watched_at` в `topic_mastery_state`.
- **Рекомендация:** добавить таблицу `video_events`.

### video_watch_time ⚠ MISSING
- Нет источника. Требует добавления.

### ai_messages_count
- **Уровень:** P
- **Источник:** `ai_chat_messages`
- **SQL:** `COUNT(*) FILTER (WHERE role = 'user')`

### ai_tutor_sessions
- **Уровень:** P
- **Формула:** число «кластеров» сообщений (`gap > 30 min` → новая сессия). Альтернативно: `COUNT(DISTINCT date_trunc('hour', created_at))`.

### weak_topics_count
- **Уровень:** P
- **Источник:** `topic_mastery_state`
- **SQL:** `COUNT(*) FILTER (WHERE status = 'weak')`

### mastered_topics_count
- **Уровень:** P
- **Источник:** `topic_mastery_state`
- **SQL:** `COUNT(*) FILTER (WHERE status = 'mastered')`

### completion_rate
- **Уровень:** P
- **Формула:** `mastered_topics_count::numeric / NULLIF(weak+medium+mastered, 0)`

### survey_satisfaction, survey_nps ⚠ MISSING
- Таблицы опроса нет. Требуется `user_feedback` перед статьёй.

