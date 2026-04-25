-- Helper: extract A-E answer letter from explanation text (Latin or Cyrillic).
CREATE OR REPLACE FUNCTION public.extract_answer_letter(_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_match text;
  v_letter text;
  v_cyr_to_lat jsonb := '{"А":"A","Б":"B","В":"C","Г":"D","Д":"E"}'::jsonb;
BEGIN
  IF _text IS NULL OR length(trim(_text)) = 0 THEN
    RETURN NULL;
  END IF;

  v_match := (regexp_match(
    _text,
    '(?:правильн[а-яё]*\s+ответ|верн[а-яё]*\s+ответ|ответ)\s*[:\-—–]?\s*[«"(]?\s*([A-EА-ДЁ])',
    'i'
  ))[1];

  IF v_match IS NULL THEN
    v_match := (regexp_match(_text, '[=≡]\s*([A-EА-ДЁ])\s*[)\.,;!\?]?\s*$', 'i'))[1];
  END IF;

  IF v_match IS NULL THEN
    RETURN NULL;
  END IF;

  v_letter := upper(v_match);
  IF v_cyr_to_lat ? v_letter THEN
    v_letter := v_cyr_to_lat ->> v_letter;
  END IF;

  IF v_letter NOT IN ('A','B','C','D','E') THEN
    RETURN NULL;
  END IF;

  RETURN v_letter;
END;
$$;

-- Flag conflicting rows. Use existing allowed status 'remove' (= excluded from pool).
UPDATE public.practice_questions pq
SET quality_status = 'remove',
    quality_reason = 'explanation_answer_mismatch'
WHERE quality_status IN ('keep','unknown','review')
  AND correct_explanation IS NOT NULL
  AND public.extract_answer_letter(correct_explanation) IS NOT NULL
  AND public.extract_answer_letter(correct_explanation) <> upper(trim(correct_answer));

-- Pool function already filters by quality_status IN ('keep','approved'),
-- so 'remove' rows are already excluded. Re-create to be explicit and add safety.
CREATE OR REPLACE FUNCTION public.get_practice_question_pool(
  requested_topic text DEFAULT NULL::text,
  recent_question_ids text[] DEFAULT NULL::text[],
  max_rows integer DEFAULT 500
)
RETURNS TABLE(
  id uuid, topic text, question_type text, correct_answer text,
  question_data jsonb, quality_status text,
  correct_explanation text, explanation_a text, explanation_b text,
  explanation_c text, explanation_d text, explanation_e text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  safe_limit integer := GREATEST(1, LEAST(COALESCE(max_rows, 500), 1000));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    pq.id, pq.topic, pq.question_type, pq.correct_answer,
    pq.question_data, pq.quality_status,
    pq.correct_explanation, pq.explanation_a, pq.explanation_b,
    pq.explanation_c, pq.explanation_d, pq.explanation_e
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
$function$;