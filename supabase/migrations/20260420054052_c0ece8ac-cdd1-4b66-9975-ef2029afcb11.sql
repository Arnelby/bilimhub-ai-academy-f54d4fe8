CREATE OR REPLACE FUNCTION public.get_practice_question_pool(
  requested_topic text DEFAULT NULL,
  recent_question_ids text[] DEFAULT NULL,
  max_rows integer DEFAULT 500
)
RETURNS TABLE (
  id uuid,
  topic text,
  question_type text,
  correct_answer text,
  question_data jsonb,
  quality_status text,
  correct_explanation text,
  explanation_a text,
  explanation_b text,
  explanation_c text,
  explanation_d text,
  explanation_e text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_limit integer := GREATEST(1, LEAST(COALESCE(max_rows, 500), 1000));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    pq.id,
    pq.topic,
    pq.question_type,
    pq.correct_answer,
    pq.question_data,
    pq.quality_status,
    pq.correct_explanation,
    pq.explanation_a,
    pq.explanation_b,
    pq.explanation_c,
    pq.explanation_d,
    pq.explanation_e
  FROM public.practice_questions pq
  WHERE pq.correct_answer IS NOT NULL
    AND pq.quality_status IN ('keep', 'approved')
    AND (
      requested_topic IS NULL
      OR lower(coalesce(pq.topic, '')) = lower(requested_topic)
    )
    AND (
      recent_question_ids IS NULL
      OR NOT ('pq_' || pq.id::text = ANY(recent_question_ids))
    )
  ORDER BY random()
  LIMIT safe_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_practice_question_pool(text, text[], integer) TO authenticated;