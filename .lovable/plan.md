## Что сейчас не на английском (аудит)

Сканирование `src/` показало **44 файла с захардкоженной кириллицей** и несколько источников данных, минующих i18n. Делю по приоритету для скриншотов.

### A. Захардкоженные строки в UI-компонентах (главная причина «русского в EN-режиме»)

**Achievements (твой пример):**
- `src/lib/achievementsSource.ts` — 12 достижений (`title`, `description`) жёстко на русском. `AchievementsPanel.tsx` рендерит `a.title` / `a.description` как есть → даже в EN-режиме они русские.

**Practice (страница, на которой ты сейчас):**
- `src/pages/Practice.tsx` — ~30 русских строк: тосты («Сначала посмотри урок…», «Тема улучшена…», «🎯 Тема «…» закрыта!»), названия сессий («Повторение ошибок», «Общая практика ОРТ», `Практика: {topic}`), экраны загрузки/ошибок («Генерация практических заданий…», «Ошибка генерации», «К тестам», «Нет заданий для практики», «Попробовать снова»), статические объяснения («Правильный ответ: …»).

**Тесты и прохождение:**
- `MathTestTaking.tsx` (28 строк), `TestTaking.tsx` (20), `Testing58Viewer.tsx` (34), `DiagnosticTest`-связанное.
- `QuestionReview.tsx` (23), `TestAnalysisDisplay.tsx` (19), `TopicStrengthAnalysis.tsx` (14), `MasteryOverview.tsx` (9).

**Уроки (все ещё ~17 файлов):**
- `DynamicLessonViewer.tsx` (88!), `FractionsLesson.tsx` (60), `LessonViewer.tsx` (23), `LessonVariant.tsx` (17), `MathLessons.tsx`, `BasicVideoPage.tsx`, `ForcedLearn.tsx` (23), а также все `components/lessons/**` (`tabs/*`, `DynamicLessonContent`, `FullTestContent`, `BasicLessonContent`, `CommonMistakes*`, `Diagrams*`, `MiniLessons*`, `AdaptiveMiniTestContent`, `LessonTree`).

**Геймификация / прочее:**
- `Leaderboard.tsx` (10), `GamificationToast.tsx` (7), `StreakCalendar.tsx` (6), `XPProgress.tsx` (2), `MotivationWidget.tsx` (7), `InviteCodeModal.tsx` (12), `Navbar.tsx` (только лейблы языков, ОК), `Dashboard.tsx`/`Profile.tsx` (форматирование «ч/м» завязано на `language`, но в EN уже работает).

**Админка:**
- `admin/PracticeQualityReview.tsx` (17).

### B. Данные/контент, которые не переводятся вовсе

1. **Темы (`topics`)**. В UI используется `useTopicName(slug)` → возвращает русское `topic.name`. В таблице `topics` ЕСТЬ поля `title_en/title_ru/title_kg` (по предыдущей миграции). Хук их не читает.
2. **`basicVideos.ts`** — `title` у 30+ роликов только по-русски (твой «видеоурок Proportions» → реально «Пропорции»). Нужен `title_en`.
3. **`topicTranslations.ts`** — карта EN→RU, обратной (EN-лейблов) нет. Нужно либо инвертировать, либо использовать как fallback при `language==='en'`.
4. **Практические задания (`practice_questions`) и уроки в Storage** — генерируются edge-функциями **только на русском**. Ты явно запретил трогать edge-функции и миграции → 100% английский для самих **вопросов/решений** на этом этапе **технически невозможен**. Это нужно зафиксировать как ограничение скриншотов.
5. **Имена пользователей** — хранятся как ввёл пользователь (кириллица). Транслитерация в UI возможна (BGN/PCGN), но это отдельное решение.

### C. KG-локаль «не работает»

- `i18n/index.ts` инициализируется корректно, но `LanguageDetector` стоит перед `lng: initialLang` — детектор может перетирать. Плюс многие компоненты до сих пор берут строки из старого `src/lib/i18n.ts` (`useLanguage().t`), который покрывает лишь ~5% UI и для KG содержит только базовый набор → при переключении на KG большая часть остаётся русской/английской.

---

## План работ (фаза 4 локализации)

### Шаг 1. Achievements → i18n
- Перевести `achievementsSource.ts` на ключи: вернуть `{ id, titleKey, descriptionKey }`. В `AchievementsPanel.tsx` рендерить `t(a.titleKey)`. Добавить блок `achievements.items.*` в `en/ru/kg.json` (12×2 строки).

### Шаг 2. Practice.tsx → i18n
- Перенести все тосты, экраны загрузки/ошибок, динамические лейблы сессий и статические объяснения на `t()` с интерполяцией (`{topic}`, `{letter}`). Namespace `practicePage.*`.

### Шаг 3. Тесты и аналитика результата → i18n
- `MathTestTaking`, `TestTaking`, `Testing58Viewer`, `QuestionReview`, `TestAnalysisDisplay`, `TopicStrengthAnalysis`, `MasteryOverview`. Общие namespace’ы `testTaking.*`, `review.*`, `analysis.*`.

### Шаг 4. Уроки → i18n (самый объёмный)
- Все `pages/*Lesson*`, `pages/LessonViewer`, `pages/DynamicLessonViewer`, `pages/LessonVariant`, `pages/BasicVideoPage`, `pages/ForcedLearn`, плюс все `components/lessons/**`. Namespace `lessonViewer.*`, `lessonTabs.*`. Само **содержимое** уроков (Storage JSON) остаётся как есть (см. ограничение D ниже).

### Шаг 5. Геймификация и виджеты → i18n
- `Leaderboard`, `GamificationToast`, `StreakCalendar`, `XPProgress`, `MotivationWidget`, `InviteCodeModal`. Namespace `gamification.*` уже частично есть — расширить.

### Шаг 6. Динамические темы из БД
- Обновить `useTopicName.ts`: читать `title_en/title_ru/title_kg` из `topics` через `getLocalized(row, 'title', language)`; если поля нет — fallback на `topicTranslations` (EN-ключ) или `topic.name`.
- Никаких миграций: используем уже существующие колонки (по [Multilingual Lesson Data] memory они есть).

### Шаг 7. `basicVideos.ts` → мультиязычно
- Заменить `title: string` на `title: { en, ru, kg }`. В местах рендера использовать `v.title[language] ?? v.title.en`. Заполнить EN-названия для 30 роликов (Quadratic Equations, Linear Equations, Proportions, …).

### Шаг 8. KG-локаль — починить переключение
- В `i18n/index.ts` убрать `LanguageDetector` (или поставить `detection.order: ['localStorage']`) и явно вызывать `i18n.changeLanguage(initialLang)` после init.
- Постепенно заполнять `kg.json` (сейчас оставляем `[KG] …` заглушки, как и договаривались — это не блокирует EN-скриншоты).

### Шаг 9. Админка `PracticeQualityReview.tsx`
- В отдельный namespace `admin.practiceReview.*`. Низкий приоритет для скриншотов студента, но нужно для полноты.

### Шаг 10. QA для EN-скриншотов
- Пройти руками: `/`, `/dashboard`, `/profile`, `/lessons`, `/practice` (со старта, в процессе, на ошибке, на завершении), `/tests`, `/test/:variant`, `/results/:id`, `/learning-plan`, `/ai-tutor`, `/leaderboard`. Зафиксировать оставшиеся русские строки и добить.

### D. Принципиальное ограничение (важно понимать до скриншотов)
Эти данные **останутся русскоязычными** в EN-режиме, потому что мы не трогаем edge-функции и БД-контент:
- **Тексты практических заданий** (`practice_questions.question/options/explanation`) — генерируются Gemini по-русски.
- **Тексты тестовых вопросов ОРТ** (`math_questions.*`) — хранятся по-русски, английских версий нет.
- **Содержимое уроков** (Storage `lessons/*.json` — теория, видео-подписи).
- **Имена пользователей** — как ввели.

Для 100%-английских скриншотов **обвязки** (навигация, кнопки, тосты, заголовки, метаданные, лейблы тем, названия достижений, названия видеоуроков) — этот план достаточен. Для англоязычного **содержимого заданий** потребуется отдельная фаза с миграцией БД и/или edge-функциями (вне текущих рамок).

### Технические детали
- Все новые строки добавлять синхронно в `en.json`, `ru.json`, `kg.json` (в KG — `[KG] <english>` как маркер).
- Использовать `useTranslation()` из `react-i18next`, а не legacy `useLanguage().t`.
- Для дат/чисел: `i18n.language === 'en' ? 'en-US' : 'ru-RU'` (паттерн уже есть в Dashboard).
- Не запускать миграции БД, не трогать `supabase/functions/**`.

### Порядок выполнения
Рекомендую делать шаги **1 → 2 → 6 → 7 → 5 → 3 → 4 → 8 → 9 → 10** — сначала закрыть твой текущий экран (Practice + Achievements + темы + видео), затем геймификацию/тесты, потом тяжёлый блок уроков, и в конце KG + админка + QA.
