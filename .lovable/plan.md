## Полная переработка i18n в BilimHub

Это крупная архитектурная задача, затрагивающая ~40 файлов, 5 таблиц БД и 3 edge-функции. Предлагаю поэтапный план с явными точками валидации, чтобы не сломать рабочую систему (Practice Engine, тесты, AI Tutor) одним большим коммитом.

---

### Фаза 1 — Фундамент i18next (без удаления старого)

1. Установить `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
2. Создать `src/i18n/index.ts` с инициализацией:
   - languages: `en`, `ru`, `kg`
   - fallbackLng: `en`
   - `saveMissing: true` + `missingKeyHandler` → `console.warn` в dev
   - detector: `localStorage` (`bilimhub-language`) → `navigator`
3. Создать пустые namespace-файлы в `src/locales/{en,ru,kg}/{common,practice,tests,learningPlan,aiTutor,auth,onboarding,mistakes,lessons,videos,pricing,admin,gamification}.json`.
4. Подключить `i18n` в `src/main.tsx` (импорт инициализатора).
5. **Адаптер совместимости:** переписать `LanguageContext` так, чтобы `setLanguage` дополнительно вызывал `i18n.changeLanguage()` и синхронизировался с `profiles.language_preference`. Старый `t` из `i18n.ts` оставить временно — компоненты мигрируем по очереди.

Точка валидации: приложение запускается, существующие переводы работают.

---

### Фаза 2 — Перенос словарей и единый источник тем

1. Перенести содержимое `src/lib/i18n.ts` (≈80 ключей) в соответствующие namespace JSON.
2. **Темы:** ввести canonical slug как единственный ключ. Helper `useTopicName(slug)`:
   - сначала читает `topics` из БД (`title_ru`/`title_kg`/`title`),
   - кэширует через React Query,
   - fallback на `t('topics:<slug>')`.
3. `src/lib/topicTranslations.ts` помечается `@deprecated` (удалим в Фазе 6 после миграции вызовов).

---

### Фаза 3 — Миграция компонентов на `useTranslation`

Порядок (от изолированных к корневым):

- `gamification/*`, `Leaderboard.tsx`, `AchievementsPanel.tsx` → `gamification.json`
- `FullNameModal.tsx`, `useAuth.tsx` (toasts) → `auth.json`, `onboarding.json`
- `MistakesBlock.tsx`, `TopicSummary.tsx` → `mistakes.json`, `practice.json`
- `Practice.tsx` → `practice.json`
- `Tests.tsx`, `TestTaking.tsx`, `MathTestTaking.tsx`, `TestResults.tsx` → `tests.json`
- `LearningPlanV2.tsx`, `NextStep.tsx` → `learningPlan.json`
- `LessonViewer.tsx`, `BasicVideoPage.tsx`, lesson tabs → `lessons.json`, `videos.json`
- `AIChatTutor.tsx` → `aiTutor.json`
- `Pricing.tsx` → `pricing.json`
- `admin/*` → `admin.json`

Удалить inline `const t = {...}` объекты. Удалить захардкоженный русский в JSX.

---

### Фаза 4 — Мультиязычный контент в БД

Миграция добавит колонки `*_en` и `*_kg` (где `*_ru` уже есть — оставляем как есть, иначе переименуем существующее в `*_ru`):

| Таблица | Поля |
|---|---|
| `math_questions` | instruction, column_a, column_b, option_c, option_d, correct_explanation, explanation_a..d |
| `math_test_questions` | instruction, column_a, column_b, correct_explanation, explanation_a..e |
| `practice_questions` | correct_explanation, explanation_a..e |
| `question_explanations` | explanation_text |
| `ai_mistake_explanations` | explanation |

Существующие данные копируются в `*_ru` (русский — текущий контент). `*_en`/`*_kg` остаются NULL до контентного наполнения.

Helper `src/lib/getLocalized.ts`:
```ts
getLocalized(row, 'instruction', lang)
// row.instruction_<lang> ?? row.instruction_en ?? row.instruction ?? ''
```

Применяется во всех select-запросах к этим таблицам в UI.

---

### Фаза 5 — Локализация AI

1. Все вызовы edge-функций передают `language` (берётся из `LanguageContext` / профиля). Часть уже передаёт — допишем для остальных.
2. `ai-practice-generate`, `ai-chat-tutor`, `ai-generate-lesson` — ввести 3-язычные системные промпты (объект `{en, ru, kg}`) вместо текущего «всегда русский».
3. AI-сгенерированные объяснения сохраняются с пометкой языка (в `ai_mistake_explanations` добавится `language` колонка), кэш ключуется по `(question_id, language)`.

---

### Фаза 6 — Чистка и CI

1. Удалить `src/lib/i18n.ts` и старый `t` из `LanguageContext` (оставить только `language`/`setLanguage`).
2. Удалить `src/lib/topicTranslations.ts`.
3. Добавить скрипт `scripts/check-i18n.mjs`: ripgrep по `src/**/*.{tsx,ts}`, ищет кириллицу вне `src/locales/` и комментариев. Подключить как `lint:i18n`.
4. ESLint custom rule опционально (отложим, если CI-скрипта достаточно).

---

### Фаза 7 — QA

Ручная проверка матрицы Pages × Languages (Dashboard, Practice, Tests, Results, LearningPlan, AI Tutor, Lessons, Videos, Pricing, Admin) × (en/ru/kg). Логируем missing keys в консоль.

---

### Технические детали

- **Объём:** ~40 файлов компонентов, 13 namespace × 3 языка = 39 JSON файлов, 1 БД-миграция (~25 ALTER TABLE), 3 edge-функции.
- **Риски:** регрессия Practice Engine (только что стабилизирован) и тестового флоу — миграция компонентов делается без изменения бизнес-логики, только замена строк на `t(...)`.
- **kg-переводы:** для UI делаем полный набор; для контента БД — пустые поля (fallback на en/ru).
- **Совместимость:** старый `useLanguage().t` продолжит работать на время Фазы 3 благодаря адаптеру.

---

### Уточняющие вопросы перед стартом

Это очень крупная работа (оценка: 10–15 итераций даже при идеальном проходе). Прежде чем начать, нужно подтверждение по двум моментам:

1. **Объём первой итерации.** Делаем всё за один проход (большой риск регрессий, длинный ревью), или режем на 2–3 PR-эквивалента: (A) Фазы 1–3 — i18next + UI, (B) Фазы 4–5 — БД + AI, (C) Фаза 6–7 — чистка + CI?

2. **Английские/кыргызские переводы UI.** Я генерирую переводы сам (быстро, но качество кыргызского у меня ограничено), или оставляю kg-ключи как заглушки `[KG] ...` для последующего наполнения переводчиком?

После ответов начинаю выполнение.