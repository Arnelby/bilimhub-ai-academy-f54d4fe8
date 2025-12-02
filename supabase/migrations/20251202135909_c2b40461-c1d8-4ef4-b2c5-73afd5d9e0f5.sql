
-- Create user diagnostic profile table
CREATE TABLE public.user_diagnostic_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Math level assessment
  math_level INTEGER DEFAULT 1,
  logic_score INTEGER DEFAULT 0,
  problem_solving_score INTEGER DEFAULT 0,
  speed_score INTEGER DEFAULT 0,
  accuracy_score INTEGER DEFAULT 0,
  
  -- Learning style
  learning_style TEXT DEFAULT 'balanced',
  visual_preference INTEGER DEFAULT 50,
  auditory_preference INTEGER DEFAULT 50,
  text_preference INTEGER DEFAULT 50,
  example_preference INTEGER DEFAULT 50,
  problem_driven_preference INTEGER DEFAULT 50,
  step_by_step_preference INTEGER DEFAULT 50,
  
  -- Psychological profile
  attention_level INTEGER DEFAULT 50,
  stress_resistance INTEGER DEFAULT 50,
  impulsiveness INTEGER DEFAULT 50,
  consistency INTEGER DEFAULT 50,
  patience INTEGER DEFAULT 50,
  confidence INTEGER DEFAULT 50,
  motivation_type TEXT DEFAULT 'balanced',
  
  -- Study preferences
  prefers_short_lessons BOOLEAN DEFAULT true,
  prefers_examples BOOLEAN DEFAULT true,
  prefers_quizzes BOOLEAN DEFAULT true,
  prefers_step_by_step BOOLEAN DEFAULT true,
  
  -- Metadata
  diagnostic_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Recommendations data
  weak_topics JSONB DEFAULT '[]',
  recommended_lessons JSONB DEFAULT '[]',
  recommended_topics JSONB DEFAULT '[]',
  recommended_mini_tests JSONB DEFAULT '[]',
  error_patterns JSONB DEFAULT '[]',
  motivation_message TEXT,
  predicted_mastery JSONB DEFAULT '{}',
  study_strategy TEXT,
  short_term_plan JSONB DEFAULT '{}',
  long_term_plan JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI learning plans v2 table
CREATE TABLE public.ai_learning_plans_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Plan structure
  plan_data JSONB NOT NULL,
  schedule JSONB DEFAULT '{}',
  target_topics JSONB DEFAULT '[]',
  daily_tasks JSONB DEFAULT '[]',
  mini_tests JSONB DEFAULT '[]',
  
  -- Forecasting
  predicted_timeline JSONB DEFAULT '{}',
  mastery_goals JSONB DEFAULT '{}',
  ort_score_projection JSONB DEFAULT '{}',
  learning_strategy TEXT,
  
  is_active BOOLEAN DEFAULT true,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mini tests table
CREATE TABLE public.mini_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID,
  topic_name TEXT,
  
  questions JSONB NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  estimated_mastery_impact INTEGER DEFAULT 5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mini test results table
CREATE TABLE public.mini_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mini_test_id UUID NOT NULL REFERENCES public.mini_tests(id),
  
  score INTEGER,
  total_questions INTEGER,
  answers JSONB DEFAULT '[]',
  time_taken_seconds INTEGER,
  
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_diagnostic_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_plans_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_diagnostic_profile
CREATE POLICY "Users can manage their own diagnostic profile"
ON public.user_diagnostic_profile FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for ai_recommendations
CREATE POLICY "Users can manage their own recommendations"
ON public.ai_recommendations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for ai_learning_plans_v2
CREATE POLICY "Users can manage their own learning plans v2"
ON public.ai_learning_plans_v2 FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for mini_tests
CREATE POLICY "Users can manage their own mini tests"
ON public.mini_tests FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for mini_test_results
CREATE POLICY "Users can manage their own mini test results"
ON public.mini_test_results FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_diagnostic_profile_updated_at
BEFORE UPDATE ON public.user_diagnostic_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_learning_plans_v2_updated_at
BEFORE UPDATE ON public.ai_learning_plans_v2
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
