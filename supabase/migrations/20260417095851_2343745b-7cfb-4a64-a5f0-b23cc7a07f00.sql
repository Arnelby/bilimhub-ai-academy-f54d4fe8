DROP POLICY IF EXISTS "Anyone authenticated can read mistake hints" ON public.ai_mistake_explanations;
DROP POLICY IF EXISTS "Anyone authenticated can insert mistake hints" ON public.ai_mistake_explanations;

CREATE POLICY "Signed-in users can read mistake hints"
  ON public.ai_mistake_explanations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can insert mistake hints"
  ON public.ai_mistake_explanations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);