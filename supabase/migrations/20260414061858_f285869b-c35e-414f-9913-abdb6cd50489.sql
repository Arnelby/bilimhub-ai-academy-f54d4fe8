
-- Drop the foreign key constraint
ALTER TABLE public.user_lesson_progress DROP CONSTRAINT IF EXISTS user_lesson_progress_lesson_id_fkey;

-- Change lesson_id from uuid to text to support video IDs like "video_variant1_5"
ALTER TABLE public.user_lesson_progress ALTER COLUMN lesson_id TYPE text USING lesson_id::text;
