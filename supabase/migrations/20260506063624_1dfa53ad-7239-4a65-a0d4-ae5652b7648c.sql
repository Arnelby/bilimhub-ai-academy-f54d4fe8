CREATE OR REPLACE FUNCTION public.global_test_access_override()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true;
$$;

REVOKE EXECUTE ON FUNCTION public.global_test_access_override() FROM anon;
GRANT EXECUTE ON FUNCTION public.global_test_access_override() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_open_math_test(_test_id integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_participant_id text;
  v_is_allowed boolean := false;
  v_question_count integer := 0;
BEGIN
  RAISE LOG '[BACKEND_ACCESS_CHECK] test_id=% user_id=%', _test_id, v_uid;

  IF v_uid IS NULL THEN
    RAISE LOG '[ACCESS_DENIED_SOURCE] source=AUTH reason=missing_user test_id=%', _test_id;
    RETURN jsonb_build_object(
      'success', false,
      'allow_access', false,
      'reason', 'LOCK_SOURCE_DETECTED',
      'source', 'AUTH',
      'detail', 'missing_user'
    );
  END IF;

  IF public.global_test_access_override() THEN
    IF _test_id = 4 THEN
      SELECT count(*) INTO v_question_count
      FROM public.math_test_questions
      WHERE test_id = 4;

      IF COALESCE(v_question_count, 0) <= 0 THEN
        RAISE LOG '[TEST4_MISSING_OR_INVALID] question_count=%', COALESCE(v_question_count, 0);
      END IF;
    END IF;

    RAISE LOG '[OVERRIDE_APPLIED] test_id=% user_id=%', _test_id, v_uid;
    RETURN jsonb_build_object(
      'success', true,
      'allow_access', true,
      'reason', 'OVERRIDE_APPLIED',
      'source', 'RPC',
      'override', true,
      'question_count', CASE WHEN _test_id = 4 THEN COALESCE(v_question_count, 0) ELSE NULL END
    );
  END IF;

  SELECT participant_id INTO v_participant_id
  FROM public.profiles
  WHERE id = v_uid
  LIMIT 1;

  IF _test_id = 3 THEN
    RETURN jsonb_build_object(
      'success', true,
      'allow_access', true,
      'reason', 'TEST3_OPEN',
      'source', 'RPC',
      'override', false
    );
  END IF;

  IF v_participant_id = 'CTRL-030' AND _test_id IN (1, 2) THEN
    RETURN jsonb_build_object(
      'success', true,
      'allow_access', true,
      'reason', 'PARTICIPANT_OVERRIDE',
      'source', 'RPC',
      'override', false
    );
  END IF;

  IF v_participant_id IS NULL THEN
    RAISE LOG '[ACCESS_DENIED_SOURCE] source=RPC reason=missing_participant test_id=% user_id=%', _test_id, v_uid;
    RETURN jsonb_build_object(
      'success', false,
      'allow_access', false,
      'reason', 'LOCK_SOURCE_DETECTED',
      'source', 'RPC',
      'detail', 'missing_participant'
    );
  END IF;

  SELECT COALESCE(ta.is_allowed, false) INTO v_is_allowed
  FROM public.test_access ta
  WHERE ta.participant_id = v_participant_id
    AND ta.test_id = _test_id
  LIMIT 1;

  IF COALESCE(v_is_allowed, false) THEN
    RETURN jsonb_build_object(
      'success', true,
      'allow_access', true,
      'reason', 'TEST_ACCESS_ALLOWED',
      'source', 'RPC',
      'override', false
    );
  END IF;

  RAISE LOG '[ACCESS_DENIED_SOURCE] source=RPC reason=test_access_denied test_id=% participant_id=%', _test_id, v_participant_id;
  RETURN jsonb_build_object(
    'success', false,
    'allow_access', false,
    'reason', 'LOCK_SOURCE_DETECTED',
    'source', 'RPC',
    'detail', 'test_access_denied'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_open_math_test(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_open_math_test(integer) TO authenticated;

DROP POLICY IF EXISTS "Authenticated can read test access during global override" ON public.test_access;
CREATE POLICY "Authenticated can read test access during global override"
ON public.test_access
FOR SELECT
TO authenticated
USING (public.global_test_access_override());