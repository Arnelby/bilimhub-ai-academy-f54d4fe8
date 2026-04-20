CREATE TABLE public.user_topic_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  accuracy DOUBLE PRECISION NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_topic_stats_user_topic_unique UNIQUE (user_id, topic)
);

CREATE INDEX idx_user_topic_stats_user_id ON public.user_topic_stats(user_id);
CREATE INDEX idx_user_topic_stats_user_accuracy ON public.user_topic_stats(user_id, accuracy);

ALTER TABLE public.user_topic_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topic stats"
ON public.user_topic_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic stats"
ON public.user_topic_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic stats"
ON public.user_topic_stats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);