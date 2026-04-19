-- Add explanation fields to question tables
ALTER TABLE public.math_questions
  ADD COLUMN IF NOT EXISTS correct_explanation TEXT,
  ADD COLUMN IF NOT EXISTS explanation_a TEXT,
  ADD COLUMN IF NOT EXISTS explanation_b TEXT,
  ADD COLUMN IF NOT EXISTS explanation_c TEXT,
  ADD COLUMN IF NOT EXISTS explanation_d TEXT;

ALTER TABLE public.math_test_questions
  ADD COLUMN IF NOT EXISTS correct_explanation TEXT,
  ADD COLUMN IF NOT EXISTS explanation_a TEXT,
  ADD COLUMN IF NOT EXISTS explanation_b TEXT,
  ADD COLUMN IF NOT EXISTS explanation_c TEXT,
  ADD COLUMN IF NOT EXISTS explanation_d TEXT,
  ADD COLUMN IF NOT EXISTS explanation_e TEXT;

ALTER TABLE public.practice_questions
  ADD COLUMN IF NOT EXISTS correct_explanation TEXT,
  ADD COLUMN IF NOT EXISTS explanation_a TEXT,
  ADD COLUMN IF NOT EXISTS explanation_b TEXT,
  ADD COLUMN IF NOT EXISTS explanation_c TEXT,
  ADD COLUMN IF NOT EXISTS explanation_d TEXT,
  ADD COLUMN IF NOT EXISTS explanation_e TEXT;

-- Allow admins to update explanations on read-only question tables
DO $$ BEGIN
  CREATE POLICY "Admins can update math_questions explanations"
    ON public.math_questions FOR UPDATE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update math_test_questions explanations"
    ON public.math_test_questions FOR UPDATE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update practice_questions explanations"
    ON public.practice_questions FOR UPDATE
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;