# Установка Supabase CLI для деплоя

## Windows (PowerShell)

### Через Scoop (рекомендуется):
```powershell
# 1. Установить Scoop (если нет)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# 2. Установить Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Через npm (если есть Node.js):
```powershell
npm install -g supabase
```

### Проверка установки:
```powershell
supabase --version
```

---

## После установки - деплой

### 1. Авторизация:
```powershell
supabase login
```

### 2. Привязка проекта:
```powershell
supabase link --project-ref mxwswezewnxshvbtvrid
```

⚠️ **ВНИМАНИЕ:** В твоем `.env` указан другой project ID: `lsisqkrzhtpxyhfmwnhq`

Проверь, какой правильный:
- `mxwswezewnxshvbtvrid` (из команды)
- `lsisqkrzhtpxyhfmwnhq` (из .env)

### 3. Деплой функции:
```powershell
supabase functions deploy ai-chat-tutor --no-verify-jwt
```

⚠️ **ВНИМАНИЕ:** Флаг `--no-verify-jwt` отключает проверку JWT!

В `config.toml` указано `verify_jwt = true`, так что правильная команда:
```powershell
supabase functions deploy ai-chat-tutor
```

---

## ⏱️ Время установки

- Через Scoop: ~5-10 минут
- Через npm: ~2-3 минуты

---

## 🆘 Если не получается установить

Можно задеплоить вручную через Supabase Dashboard:

1. Открой https://supabase.com/dashboard
2. Выбери проект
3. Functions → ai-chat-tutor → Edit
4. Скопируй код из `supabase/functions/ai-chat-tutor/index.ts`
5. Вставь и нажми Deploy

**Но это медленнее и неудобнее!**
