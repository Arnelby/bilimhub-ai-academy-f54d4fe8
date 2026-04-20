CREATE OR REPLACE FUNCTION public.apply_practice_explanations(_payload jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH src AS (
    SELECT
      (e->>'id')::uuid AS id,
      e->>'correct_explanation' AS correct_explanation,
      e->>'explanation_a' AS explanation_a,
      e->>'explanation_b' AS explanation_b,
      e->>'explanation_c' AS explanation_c,
      e->>'explanation_d' AS explanation_d,
      e->>'explanation_e' AS explanation_e
    FROM jsonb_array_elements(_payload) AS e
  )
  UPDATE practice_questions pq SET
    correct_explanation = COALESCE(pq.correct_explanation, src.correct_explanation),
    explanation_a       = COALESCE(pq.explanation_a, src.explanation_a),
    explanation_b       = COALESCE(pq.explanation_b, src.explanation_b),
    explanation_c       = COALESCE(pq.explanation_c, src.explanation_c),
    explanation_d       = COALESCE(pq.explanation_d, src.explanation_d),
    explanation_e       = COALESCE(pq.explanation_e, src.explanation_e)
  FROM src
  WHERE pq.id = src.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;