INSERT INTO public.tests (id, title, title_ru, subject, type, duration_minutes)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'Математика тест вариант 3', 'Математика тест вариант 3', 'mathematics', 'practice', 30),
  ('00000000-0000-0000-0000-000000000004', 'Математика тест вариант 4', 'Математика тест вариант 4', 'mathematics', 'practice', 60)
ON CONFLICT (id) DO NOTHING;