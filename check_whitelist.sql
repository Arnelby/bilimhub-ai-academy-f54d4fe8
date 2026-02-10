-- Проверить все записи в whitelist
SELECT 
  email, 
  invite_code, 
  is_active, 
  used_at,
  notes,
  created_at 
FROM beta_whitelist 
ORDER BY created_at DESC;

-- Проверить конкретный код
SELECT * FROM beta_whitelist WHERE invite_code = 'BETA2024-XL';

-- Проверить функции
SELECT is_email_whitelisted('rashidovarnel@gmail.com');
SELECT is_invite_code_valid('BETA2024-AR');
