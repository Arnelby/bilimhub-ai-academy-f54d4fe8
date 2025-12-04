-- Add image_url column to questions table for ORT test images
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;