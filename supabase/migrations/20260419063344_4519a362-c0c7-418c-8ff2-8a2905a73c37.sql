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
      quality_status      = 'keep'
  FROM pq_explanation_staging s
  WHERE pq.id = s.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;