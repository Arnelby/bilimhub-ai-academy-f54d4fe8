
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'control';

ALTER TABLE public.user_tests 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER,
ADD COLUMN IF NOT EXISTS test_type TEXT;
