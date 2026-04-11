
-- Fix views: set security_invoker = true
ALTER VIEW public.research_user_metrics SET (security_invoker = true);
ALTER VIEW public.research_topic_metrics SET (security_invoker = true);

-- Enable RLS on unprotected tables
ALTER TABLE public.math_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view math_questions" ON public.math_questions FOR SELECT TO authenticated USING (true);

ALTER TABLE public.math_test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view math_test_questions" ON public.math_test_questions FOR SELECT TO authenticated USING (true);
