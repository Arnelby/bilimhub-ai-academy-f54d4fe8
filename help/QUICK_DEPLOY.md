# ⚡ Быстрый деплой обновленных функций

## 🚨 ПРОБЛЕМА
Supabase CLI нельзя установить через npm. Нужен другой способ.

---

## ✅ РЕШЕНИЕ 1: Через Lovable.dev (САМЫЙ БЫСТРЫЙ - 2 минуты)

### Поскольку проект создан в Lovable:

1. Открой https://lovable.dev/projects/b018d48b-2f55-4b9b-ae4b-bf10c6cf8ff7
2. Нажми на иконку чата (AI помощник Lovable)
3. Напиши:
   ```
   Deploy the updated Supabase functions to production.
   Files updated:
   - supabase/functions/ai-chat-tutor/index.ts
   - supabase/functions/ai-generate-ort-test/index.ts
   ```
4. Lovable автоматически задеплоит на Supabase

**Время:** 2-3 минуты  
**Сложность:** Легко  
**Риск:** Нет

---

## ✅ РЕШЕНИЕ 2: Ручной деплой через Supabase Dashboard (5 минут)

### Шаг 1: Открой Supabase
```
https://supabase.com/dashboard/project/lsisqkrzhtpxyhfmwnhq
```

(Или другой project ID, если это не тот проект)

### Шаг 2: Деплой ai-chat-tutor

1. **Functions** (левое меню)
2. Найди `ai-chat-tutor` → нажми на него
3. Кнопка **Edit** (или три точки → Edit)
4. **Полностью удали** старый код
5. **Скопируй** содержимое из:
   ```
   d:\ai_cooomo\supabase\functions\ai-chat-tutor\index.ts
   ```
6. **Вставь** в редактор
7. **Deploy** (или Save & Deploy)

### Шаг 3: Деплой ai-generate-ort-test

Повтори шаги 2-7 для `ai-generate-ort-test`

### Шаг 4: Проверка

1. Открой **Logs** для каждой функции
2. Сделай тестовый вызов (см. TEST_COMMANDS.md)
3. В логах должен быть статус "200 OK"

---

## ✅ РЕШЕНИЕ 3: Установить Scoop + Supabase CLI (10 минут)

### Установка Scoop:
```powershell
# Открой PowerShell от имени администратора
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Установка Supabase CLI:
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Затем деплой:
```powershell
supabase login
supabase link --project-ref lsisqkrzhtpxyhfmwnhq  # правильный ID!
supabase functions deploy ai-chat-tutor
supabase functions deploy ai-generate-ort-test
```

---

## ⚠️ ВАЖНО: Project ID

В твоих командах:
```
--project-ref mxwswezewnxshvbtvrid  ← ЭТО ЧТО ЗА ID?
```

В твоем `.env`:
```
VITE_SUPABASE_PROJECT_ID="lsisqkrzhtpxyhfmwnhq"  ← ПРАВИЛЬНЫЙ
```

**ПРОВЕРЬ у Арнеля**, какой project ID правильный!

Возможно:
- `lsisqkrzhtpxyhfmwnhq` - production
- `mxwswezewnxshvbtvrid` - staging/test

---

## 🎯 МОЯ РЕКОМЕНДАЦИЯ

### ДЛЯ СРОЧНОГО ДЕПЛОЯ (до питча):
👉 **Используй Lovable.dev** (Решение 1)

**Почему:**
- Проект создан через Lovable
- Автоматический деплой
- Нет риска ошибиться
- 2 минуты вместо 10-15

### ПОСЛЕ ПИТЧА (для разработки):
👉 **Установи Scoop + CLI** (Решение 3)

**Почему:**
- Удобнее для частых деплоев
- Можно делать локальное тестирование
- Профессиональный подход

---

## 📋 Чек-лист после деплоя

- [ ] Функции показывают статус "Active"
- [ ] В логах нет ошибок
- [ ] Тестовый вызов работает (TEST_COMMANDS.md)
- [ ] Промпт "Ministry Engine" применился (проверь ответ ИИ)
- [ ] Метод Сократа работает (ИИ задает вопросы, не дает ответ)

---

## 🆘 Если что-то пошло не так

### Ошибка при деплое:
1. Проверь синтаксис TypeScript (может быть опечатка)
2. Проверь, что все переменные имеют дефолты
3. Посмотри логи ошибок в Supabase

### Функция не работает после деплоя:
1. Проверь Environment Variables (LOVABLE_API_KEY)
2. Проверь логи функции
3. Попробуй редеплой (Deploy → Save again)

### Не можешь зайти в Dashboard:
1. Попроси Арнеля дать тебе доступ:
   - Settings → Team → Invite
2. Или пусть он сам задеплоит (покажи ему эту инструкцию)

---

**Время до питча: 4 дня. Выбирай быстрый способ! ⚡**
