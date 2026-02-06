-- Защита контента: Storage RLS для видео и материалов

-- Создать buckets если не существуют
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('lessons', 'lessons', false, 524288000, ARRAY['video/mp4', 'video/webm', 'image/png', 'image/jpeg', 'application/pdf']::text[]),
  ('lesson-materials', 'lesson-materials', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg']::text[])
ON CONFLICT (id) DO NOTHING;

-- RLS политики для lessons bucket
CREATE POLICY "Authenticated users can view lessons"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lessons' 
  AND auth.role() = 'authenticated'
);

-- Только админы могут загружать
CREATE POLICY "Admin can upload lessons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lessons'
  AND auth.jwt() ->> 'role' = 'admin'
);

-- Только админы могут удалять
CREATE POLICY "Admin can delete lessons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lessons'
  AND auth.jwt() ->> 'role' = 'admin'
);

-- RLS для lesson-materials bucket
CREATE POLICY "Authenticated users can view materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-materials' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-materials'
  AND auth.jwt() ->> 'role' = 'admin'
);

-- Функция для создания signed URL (защищенная ссылка с ограниченным временем)
CREATE OR REPLACE FUNCTION get_lesson_video_url(
  video_path TEXT,
  expires_in INT DEFAULT 3600 -- 1 час по умолчанию
)
RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Проверка авторизации
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- В продакшене Supabase автоматически создаст signed URL
  -- Это placeholder для логики
  RETURN format('https://%s.supabase.co/storage/v1/object/sign/lessons/%s?token=...&expires=%s',
    current_setting('app.settings.project_ref', true),
    video_path,
    expires_in
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting для Storage access
CREATE TABLE IF NOT EXISTS storage_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  bucket_id TEXT NOT NULL,
  object_path TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET
);

-- Индекс для быстрой проверки rate limit
CREATE INDEX idx_storage_access_user_time 
ON storage_access_log(user_id, accessed_at DESC);

-- Функция проверки rate limit (100 запросов в час)
CREATE OR REPLACE FUNCTION check_storage_rate_limit()
RETURNS BOOLEAN AS $$
DECLARE
  access_count INT;
BEGIN
  SELECT COUNT(*) INTO access_count
  FROM storage_access_log
  WHERE user_id = auth.uid()
    AND accessed_at > now() - INTERVAL '1 hour';
  
  RETURN access_count < 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE storage_access_log IS 'Лог доступа к защищенному контенту для rate limiting';
