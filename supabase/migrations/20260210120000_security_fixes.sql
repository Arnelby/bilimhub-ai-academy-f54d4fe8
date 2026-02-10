-- SECURITY FIXES: Исправление уязвимостей найденных Lovable
-- 2026-02-10

-- 1. БЛОКИРОВАТЬ АНОНИМНЫЙ ДОСТУП К PROFILES
-- Добавить явную политику, запрещающую анонимам видеть профили
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. БЛОКИРОВАТЬ ПУБЛИЧНЫЙ ДОСТУП К BETA_WHITELIST
-- Добавить явную политику, запрещающую всем (кроме админов и владельцев email) видеть whitelist
DROP POLICY IF EXISTS "Users can check their email" ON beta_whitelist;

CREATE POLICY "Block public access to whitelist"
ON beta_whitelist FOR SELECT
USING (
  -- Только админы или владельцы email могут видеть
  auth.jwt() ->> 'role' = 'admin' 
  OR email = auth.jwt() ->> 'email'
);

-- 3. ЯВНО ЗАПРЕТИТЬ АНОНИМАМ ДОСТУП К INVITE CODES (на случай если таблица существует)
-- Если таблица invite_codes существует на продакшене
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'invite_codes'
  ) THEN
    EXECUTE 'ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Block public access to invite codes" ON public.invite_codes FOR SELECT USING (false)';
  END IF;
END $$;

-- 4. ЯВНО ЗАПРЕТИТЬ АНОНИМАМ ДОСТУП К BETA_ACCESS (на случай если таблица существует)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'beta_access'
  ) THEN
    EXECUTE 'ALTER TABLE public.beta_access ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Block public access to beta access" ON public.beta_access FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

COMMENT ON POLICY "Block anonymous access to profiles" ON public.profiles IS 'Security: Prevent anonymous users from viewing profiles';
COMMENT ON POLICY "Block public access to whitelist" ON beta_whitelist IS 'Security: Prevent unauthorized access to invite codes';
