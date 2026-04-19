-- Staging table for offline explanation import
CREATE TABLE IF NOT EXISTS public.pq_explanation_staging (
  id uuid PRIMARY KEY,
  correct_explanation text,
  explanation_a text,
  explanation_b text,
  explanation_c text,
  explanation_d text
);

ALTER TABLE public.pq_explanation_staging ENABLE ROW LEVEL SECURITY;

-- Admin-only helper to apply staged explanations into practice_questions
CREATE OR REPLACE FUNCTION public.apply_pq_explanations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE practice_questions pq
  SET correct_explanation = s.correct_explanation,
      explanation_a       = s.explanation_a,
      explanation_b       = s.explanation_b,
      explanation_c       = s.explanation_c,
      explanation_d       = s.explanation_d,
      quality_status      = 'approved'
  FROM pq_explanation_staging s
  WHERE pq.id = s.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Grant load access to the sandbox import role used by /dev-server psql
GRANT INSERT, SELECT, TRUNCATE ON public.pq_explanation_staging TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.apply_pq_explanations() TO sandbox_exec;