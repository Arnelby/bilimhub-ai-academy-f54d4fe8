
CREATE TABLE public.issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  title text NOT NULL,
  description text NOT NULL,
  page_url text,
  page_name text,
  language text,
  browser_info jsonb DEFAULT '{}'::jsonb,
  screenshot_url text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT issue_reports_status_check CHECK (status IN ('open','in_progress','resolved'))
);

ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reports"
  ON public.issue_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports"
  ON public.issue_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reports"
  ON public.issue_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete reports"
  ON public.issue_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_issue_reports_updated_at
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_issue_reports_user ON public.issue_reports(user_id);
CREATE INDEX idx_issue_reports_status ON public.issue_reports(status);

-- Storage bucket for screenshots (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-screenshots', 'issue-screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own issue screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'issue-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own issue screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'issue-screenshots'
    AND (auth.uid()::text = (storage.foldername(name))[1]
         OR public.has_role(auth.uid(), 'admin'::app_role))
  );
