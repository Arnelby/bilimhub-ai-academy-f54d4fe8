-- Create homework_submissions table
CREATE TABLE public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  subject TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'reviewed', 'needs_improvement', 'completed')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_homework_feedback table
CREATE TABLE public.ai_homework_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.homework_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feedback TEXT NOT NULL,
  suggestions TEXT,
  corrections TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  additional_exercises JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homework_notifications table
CREATE TABLE public.homework_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  submission_id UUID REFERENCES public.homework_submissions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('review_complete', 'reminder', 'badge_earned')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_homework_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for homework_submissions
CREATE POLICY "Users can view their own homework submissions"
ON public.homework_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own homework submissions"
ON public.homework_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own homework submissions"
ON public.homework_submissions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for ai_homework_feedback
CREATE POLICY "Users can view their own homework feedback"
ON public.ai_homework_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own homework feedback"
ON public.ai_homework_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for homework_notifications
CREATE POLICY "Users can view their own notifications"
ON public.homework_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.homework_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.homework_notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for homework files
INSERT INTO storage.buckets (id, name, public) VALUES ('homework', 'homework', false);

-- Storage policies
CREATE POLICY "Users can upload their own homework files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'homework' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own homework files"
ON storage.objects FOR SELECT
USING (bucket_id = 'homework' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own homework files"
ON storage.objects FOR DELETE
USING (bucket_id = 'homework' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_homework_submissions_updated_at
BEFORE UPDATE ON public.homework_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();