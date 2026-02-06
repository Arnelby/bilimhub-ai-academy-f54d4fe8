-- Whitelist для закрытой беты
CREATE TABLE IF NOT EXISTS beta_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  invite_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  used_at TIMESTAMPTZ,
  invited_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS политики
ALTER TABLE beta_whitelist ENABLE ROW LEVEL SECURITY;

-- Админ может все
CREATE POLICY "Admin full access to whitelist"
ON beta_whitelist FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Пользователи могут проверить свой email
CREATE POLICY "Users can check their email"
ON beta_whitelist FOR SELECT
USING (email = auth.jwt() ->> 'email');

-- Функция проверки whitelist
CREATE OR REPLACE FUNCTION is_email_whitelisted(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beta_whitelist
    WHERE email = check_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция проверки invite кода
CREATE OR REPLACE FUNCTION is_invite_code_valid(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM beta_whitelist
    WHERE invite_code = code AND is_active = true AND used_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пример добавления whitelist записей (закомментировано, добавить вручную)
-- INSERT INTO beta_whitelist (email, invite_code, notes) VALUES
-- ('student1@example.kg', 'BETA2026-001', 'First beta tester'),
-- ('student2@example.kg', 'BETA2026-002', 'Second beta tester');

COMMENT ON TABLE beta_whitelist IS 'Закрытая бета: только разрешенные пользователи';
