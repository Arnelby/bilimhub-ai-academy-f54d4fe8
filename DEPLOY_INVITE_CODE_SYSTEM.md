# 🚀 DEPLOY: INVITE CODE SYSTEM

## ✅ ЧТО СДЕЛАНО:

1. **SQL Миграция** (`20260210043000_invite_code_rpc.sql`)
   - RPC функция `use_invite_code(_code TEXT, _user_id UUID)` - активация кода
   - RPC функция `has_beta_access(_user_id UUID)` - проверка beta доступа
   - Совместимость с существующей таблицей `beta_whitelist`

2. **Frontend Компоненты**
   - `src/hooks/useBetaAccess.tsx` - Hook для работы с beta доступом
   - `src/components/beta/InviteCodeModal.tsx` - Модальное окно для ввода кода
   - `src/components/beta/BetaAccessGuard.tsx` - Guard для защиты роутов
   - Обновлён `src/App.tsx` - все защищённые роуты обёрнуты в `BetaAccessGuard`

## 📋 ШАГ 1: ПРИМЕНИТЬ SQL МИГРАЦИЮ

Зайди в **Supabase Dashboard** → **SQL Editor** и выполни:

```sql
-- Скопируй и выполни файл: supabase/migrations/20260210043000_invite_code_rpc.sql
```

Или напрямую:

```sql
CREATE OR REPLACE FUNCTION use_invite_code(_code TEXT, _user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_email TEXT;
  v_whitelist_record RECORD;
BEGIN
  -- Получить email пользователя
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = _user_id;

  IF v_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Найти запись в whitelist по invite code
  SELECT * INTO v_whitelist_record
  FROM beta_whitelist
  WHERE invite_code = _code
    AND is_active = true
    AND used_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid invite code'
    );
  END IF;

  -- Отметить код как использованный
  UPDATE beta_whitelist
  SET used_at = now()
  WHERE invite_code = _code;

  RETURN json_build_object(
    'success', true,
    'message', 'Beta access granted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_beta_access(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = _user_id;

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM beta_whitelist
    WHERE email = v_email
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 ШАГ 2: ДОБАВИТЬ ТЕСТЕРОВ

Выполни (если ещё не выполнено):

```sql
INSERT INTO beta_whitelist (email, invite_code, notes, is_active)
VALUES
  ('elitabelekova998@gmail.com', 'BETA2024-EL', 'Beta Tester 1', true),
  ('h80963998@gmail.com', 'BETA2024-H8', 'Beta Tester 2', true),
  ('keneshbekovaindira1@gmail.com', 'BETA2024-KI', 'Beta Tester 3', true),
  ('dianabakeeva572@gmail.com', 'BETA2024-DB', 'Beta Tester 4', true),
  ('rashidovarnel@gmail.com', 'BETA2024-AR', 'Beta Tester 5', true)
ON CONFLICT (email) 
DO UPDATE SET 
  is_active = true,
  notes = EXCLUDED.notes;
```

## 📋 ШАГ 3: ДЕПЛОЙ НА LOVABLE

1. **Зайди в Lovable** → https://lovable.dev
2. **Settings → Deployment Branch** → Выбери `prod`
3. **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://mxwswezewnxshvbtvrid.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (из файла `LOVABLE_ENV_VARS.txt`)
4. **Нажми Publish**

## 🎯 КАК ЭТО РАБОТАЕТ:

### ФЛОУ 1: РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ

1. Пользователь заходит на `/signup`
2. Регистрируется (создаётся `auth.users` запись)
3. Логинится и попадает на `/diagnostic-test`
4. `BetaAccessGuard` проверяет `has_beta_access(user_id)`
5. Если `false` → показывает `InviteCodeModal`
6. Пользователь вводит код (например, `BETA2024-KI`)
7. Вызывается `use_invite_code(code, user_id)`
8. Если email совпадает с `beta_whitelist` → `used_at = now()`
9. Доступ разрешён ✅

### ФЛОУ 2: СУЩЕСТВУЮЩИЙ WHITELISTED EMAIL

1. Пользователь с `keneshbekovaindira1@gmail.com` регистрируется
2. Логинится, `BetaAccessGuard` проверяет `has_beta_access`
3. Email уже в `beta_whitelist` → доступ разрешён сразу ✅
4. Invite код не требуется

## ⚡ КОДЫ ДЛЯ ТЕСТЕРОВ:

| Email | Invite Code |
|-------|------------|
| elitabelekova998@gmail.com | **BETA2024-EL** |
| h80963998@gmail.com | **BETA2024-H8** |
| keneshbekovaindira1@gmail.com | **BETA2024-KI** |
| dianabakeeva572@gmail.com | **BETA2024-DB** |
| rashidovarnel@gmail.com | **BETA2024-AR** |

## ✅ ПРОВЕРКА:

1. Зарегистрируй нового пользователя (не из whitelist)
2. Войди в систему
3. Должно появиться модальное окно **"Запущено бета-тестирование"**
4. Введи любой код (например, `BETA2024-AR`)
5. Если ошибка → проверь:
   - Выполнена ли SQL миграция
   - Есть ли код в `beta_whitelist`
   - Правильные ли env variables в Lovable

---

## 🔥 ГОТОВО!
