
-- Recreate views with security_invoker to respect RLS
CREATE OR REPLACE VIEW public.research_clean_tests
WITH (security_invoker = true) AS
SELECT * FROM public.user_tests
WHERE data_version = 'v2' AND is_reliable = true;

CREATE OR REPLACE VIEW public.research_clean_attempts
WITH (security_invoker = true) AS
SELECT * FROM public.question_attempts
WHERE data_version = 'v2' AND is_reliable = true;

CREATE OR REPLACE VIEW public.research_clean_practice
WITH (security_invoker = true) AS
SELECT * FROM public.practice_responses
WHERE data_version = 'v2' AND is_reliable = true;

CREATE OR REPLACE VIEW public.research_clean_sessions
WITH (security_invoker = true) AS
SELECT * FROM public.practice_sessions
WHERE data_version = 'v2' AND is_reliable = true;
