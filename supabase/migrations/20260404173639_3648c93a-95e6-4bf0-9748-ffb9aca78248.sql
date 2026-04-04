CREATE TABLE public.video_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id text NOT NULL,
  question_number integer NOT NULL,
  youtube_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(test_id, question_number)
);

ALTER TABLE public.video_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video solutions"
  ON public.video_solutions
  FOR SELECT
  TO authenticated
  USING (true);