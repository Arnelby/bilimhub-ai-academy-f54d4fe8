# 🚀 Ручной деплой функций (без CLI)

## Способ 1: Через Supabase Dashboard (GUI)

### Шаг 1: Открой проект
1. Перейди на https://supabase.com/dashboard
2. Выбери проект BilimHub
3. В левом меню: **Functions**

### Шаг 2: Деплой ai-chat-tutor
1. Найди функцию `ai-chat-tutor` в списке
2. Нажми на нее
3. Нажми **Edit Function** или **Deploy New Version**
4. Скопируй весь код из файла `supabase/functions/ai-chat-tutor/index.ts`
5. Вставь в редактор
6. Нажми **Deploy**
7. Дождись статуса "Deployed successfully"

### Шаг 3: Деплой ai-generate-ort-test
1. Найди функцию `ai-generate-ort-test`
2. Повтори шаги 2-7

### Шаг 4: Проверка
1. В списке функций обе должны показывать статус "Active"
2. Проверь логи (Logs) - не должно быть ошибок

---

## Способ 2: Через Lovable.dev (если проект оттуда)

### Шаг 1: Открой Lovable
```
https://lovable.dev/projects/b018d48b-2f55-4b9b-ae4b-bf10c6cf8ff7
```

### Шаг 2: Используй Lovable AI
1. Нажми на кнопку чата
2. Напиши:
   ```
   Deploy the updated ai-chat-tutor and ai-generate-ort-test functions
   to Supabase. The code is already updated in the files.
   ```

3. Lovable автоматически задеплоит изменения

---

## ⚠️ Важные замечания

### Project Reference ID
В твоем `.env` указан:
```
VITE_SUPABASE_PROJECT_ID="lsisqkrzhtpxyhfmwnhq"
```

Но ты пытаешься привязать:
```
--project-ref mxwswezewnxshvbtvrid
```

**Это разные проекты!** Проверь, какой правильный.

### JWT Verification
В команде указано `--no-verify-jwt`, но в `config.toml` стоит:
```toml
[functions.ai-chat-tutor]
verify_jwt = true
```

**Рекомендация:** Оставь `verify_jwt = true` для безопасности. Убери флаг `--no-verify-jwt`.

---

## 🎯 Что делать прямо сейчас

### Если ты Алишер:
1. **Установи Supabase CLI:** `npm install -g supabase`
2. **Авторизуйся:** `supabase login`
3. **Проверь project ID** (спроси у Арнеля правильный)
4. **Деплой**

### Если ты Арнель:
1. Дай Алишеру доступ к Supabase Dashboard (Settings → Team)
2. Или задеплой сам через GUI (инструкция выше)
3. Или используй Lovable.dev для автодеплоя

---

## 🔧 Команды для деплоя (когда CLI установлен)

```powershell
# 1. Установка
npm install -g supabase

# 2. Авторизация
supabase login

# 3. Проверка правильного project ID
# Открой https://supabase.com/dashboard -> Project Settings -> General
# Скопируй Reference ID

# 4. Привязка (замени на правильный ID!)
supabase link --project-ref ВАШ_ПРАВИЛЬНЫЙ_ID

# 5. Деплой обеих функций
supabase functions deploy ai-chat-tutor
supabase functions deploy ai-generate-ort-test

# 6. Проверка
supabase functions list
```

---

## ✅ После успешного деплоя

Проверь, что функции работают:

1. Открой Supabase Dashboard → Functions
2. Найди `ai-chat-tutor` → вкладка **Logs**
3. Сделай тестовый вызов (см. `TEST_COMMANDS.md`)
4. В логах должно быть: "200 OK" без ошибок

---

## 🆘 Частые ошибки

### "Error: Invalid project ref"
**Причина:** Неправильный project ID  
**Решение:** Проверь ID в Supabase Dashboard

### "Error: Unauthorized"
**Причина:** Не залогинен  
**Решение:** Выполни `supabase login`

### "Error: Function not found"
**Причина:** Папка функции не найдена  
**Решение:** Убедись, что ты в корне проекта (`d:\ai_cooomo`)

---

**Выбирай способ и вперед! Время до питча идет! ⏰**
