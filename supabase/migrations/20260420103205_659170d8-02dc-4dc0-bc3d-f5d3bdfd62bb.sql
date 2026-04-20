-- Spaced repetition tracking table (deterministic, no AI)
CREATE TABLE public.spaced_repetition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review')),
  correct_streak integer NOT NULL DEFAULT 0,
  next_review_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT spaced_repetition_user_question_unique UNIQUE (user_id, question_id)
);

CREATE INDEX idx_spaced_repetition_user_due
  ON public.spaced_repetition (user_id, next_review_date);

ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spaced repetition"
  ON public.spaced_repetition FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spaced repetition"
  ON public.spaced_repetition FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaced repetition"
  ON public.spaced_repetition FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaced repetition"
  ON public.spaced_repetition FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_spaced_repetition_updated_at
  BEFORE UPDATE ON public.spaced_repetition
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();