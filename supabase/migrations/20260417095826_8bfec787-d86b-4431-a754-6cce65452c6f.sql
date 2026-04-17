-- Static, full explanation per question (independent of user answer)
CREATE TABLE IF NOT EXISTS public.question_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL UNIQUE,
  correct_answer TEXT NOT NULL,
  explanation_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_explanations_qid
  ON public.question_explanations(question_id);

ALTER TABLE public.question_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view explanations"
  ON public.question_explanations FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage explanations"
  ON public.question_explanations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_question_explanations_updated_at
  BEFORE UPDATE ON public.question_explanations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cached AI mistake hints keyed by question + wrong user_answer
CREATE TABLE IF NOT EXISTS public.ai_mistake_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_answer)
);

CREATE INDEX IF NOT EXISTS idx_ai_mistake_explanations_lookup
  ON public.ai_mistake_explanations(question_id, user_answer);

ALTER TABLE public.ai_mistake_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read mistake hints"
  ON public.ai_mistake_explanations FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Anyone authenticated can insert mistake hints"
  ON public.ai_mistake_explanations FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage mistake hints"
  ON public.ai_mistake_explanations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));