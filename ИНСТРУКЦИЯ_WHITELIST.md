# 🔐 ИНСТРУКЦИЯ: КАК ДОБАВИТЬ БЕТА-ТЕСТЕРОВ

## ШАГ 1: ЗАЙТИ В SUPABASE DASHBOARD
1. Открой https://supabase.com/dashboard
2. Выбери проект **BilimHub** (`mxwswezewnxshvbtvrid`)
3. Слева выбери **SQL Editor**

## ШАГ 2: ВЫПОЛНИТЬ SQL
Скопируй **ВЕСЬ КОД** из файла `add_5_beta_testers.sql`:

```sql
INSERT INTO beta_whitelist (email, invite_code, notes, is_active)
VALUES
  ('elitabelekova998@gmail.com', 'BETA2024-EL', 'Beta Tester 1', true),
  ('h80963998@gmail.com', 'BETA2024-H8', 'Beta Tester 2', true),
  ('keneshbekovaindira1@gmail.com', 'BETA2024-KI', 'Beta Tester 3 - Индира', true),
  ('dianabakeeva572@gmail.com', 'BETA2024-DB', 'Beta Tester 4 - Диана', true),
  ('rashidovarnel@gmail.com', 'BETA2024-AR', 'Beta Tester 5 - Арнель', true)
ON CONFLICT (email) 
DO UPDATE SET 
  is_active = true,
  notes = EXCLUDED.notes;
```

## ШАГ 3: НАЖАТЬ RUN
Должно появиться: **"Success. No rows returned"**

## ШАГ 4: ПРОВЕРКА
Выполни:
```sql
SELECT email, invite_code, is_active FROM beta_whitelist;
```

Должны появиться 5 записей.

## ШАГ 5: РАЗДАТЬ КОДЫ
Отправь каждому тестеру его invite code:

| Email | Invite Code |
|-------|------------|
| elitabelekova998@gmail.com | BETA2024-EL |
| h80963998@gmail.com | BETA2024-H8 |
| keneshbekovaindira1@gmail.com | BETA2024-KI |
| dianabakeeva572@gmail.com | BETA2024-DB |
| rashidovarnel@gmail.com | BETA2024-AR |

---

## 🚀 ГОТОВО!
Теперь пользователи могут:
1. Зайти на сайт
2. Ввести свой invite code
3. Зарегистрироваться
