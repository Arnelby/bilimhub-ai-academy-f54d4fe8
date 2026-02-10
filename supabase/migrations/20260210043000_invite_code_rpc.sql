-- Добавить RPC функцию для активации invite кода
-- Совместимость с компонентом InviteCodeModal из main

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

  -- Проверить, что email совпадает (опционально)
  -- IF v_whitelist_record.email != v_email THEN
  --   RETURN json_build_object(
  --     'success', false,
  --     'error', 'Invite code does not match your email'
  --   );
  -- END IF;

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

-- Добавить функцию проверки beta доступа пользователя
CREATE OR REPLACE FUNCTION has_beta_access(_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Получить email пользователя
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = _user_id;

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  -- Проверить, есть ли пользователь в whitelist (активный или уже использовавший код)
  RETURN EXISTS (
    SELECT 1 FROM beta_whitelist
    WHERE email = v_email
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION use_invite_code IS 'Активировать invite код для пользователя';
COMMENT ON FUNCTION has_beta_access IS 'Проверить, есть ли у пользователя beta доступ';
