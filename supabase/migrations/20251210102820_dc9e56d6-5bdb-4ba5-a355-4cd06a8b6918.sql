-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin_topics table for content management
CREATE TABLE public.admin_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_ru TEXT,
    title_kg TEXT,
    description TEXT,
    description_ru TEXT,
    description_kg TEXT,
    subject TEXT NOT NULL,
    level_grade INTEGER DEFAULT 1,
    content_blocks JSONB DEFAULT '[]'::jsonb,
    ai_labels TEXT[] DEFAULT '{}',
    ai_categories TEXT[] DEFAULT '{}',
    ai_metadata JSONB DEFAULT '{}'::jsonb,
    learning_styles JSONB DEFAULT '{"visual": null, "auditory": null, "reading_writing": null, "problem_solver": null}'::jsonb,
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    parent_topic_id UUID REFERENCES public.admin_topics(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_topics
ALTER TABLE public.admin_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_topics
CREATE POLICY "Anyone can view published topics"
ON public.admin_topics
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all topics"
ON public.admin_topics
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_topics_updated_at
BEFORE UPDATE ON public.admin_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create admin_training_datasets table for AI training data
CREATE TABLE public.admin_training_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    dataset_type TEXT NOT NULL,
    data JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_training_datasets
ALTER TABLE public.admin_training_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage training datasets"
ON public.admin_training_datasets
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));