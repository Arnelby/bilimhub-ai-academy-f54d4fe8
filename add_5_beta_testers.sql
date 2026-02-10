-- Добавить 5 бета-тестеров в whitelist
-- Выполнить в Supabase SQL Editor

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

-- Проверка:
SELECT email, invite_code, is_active, used_at, created_at 
FROM beta_whitelist 
ORDER BY created_at DESC;
