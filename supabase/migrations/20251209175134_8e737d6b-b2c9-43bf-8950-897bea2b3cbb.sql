-- Add target ORT score, exam date, and grade level to user_diagnostic_profile
ALTER TABLE public.user_diagnostic_profile 
ADD COLUMN IF NOT EXISTS target_ort_score integer DEFAULT 170,
ADD COLUMN IF NOT EXISTS exam_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS grade_level text,
ADD COLUMN IF NOT EXISTS months_until_exam integer;