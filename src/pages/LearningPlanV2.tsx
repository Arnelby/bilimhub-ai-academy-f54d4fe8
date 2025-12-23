import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Calendar, Target, TrendingUp, Brain, RefreshCw, Loader2, 
  CheckCircle, Clock, BookOpen, Award, ChevronRight 
} from "lucide-react";

interface LearningPlan {
  planData: any;
  schedule: any;
  targetTopics: any[];
  dailyTasks: any[];
  miniTests: any[];
  predictedTimeline: any;
  masteryGoals: any;
  ortScoreProjection: any;
  learningStrategy: string;
}

export default function LearningPlanV2() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { language } = useLanguage();
  
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [diagnosticProfile, setDiagnosticProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch diagnostic profile
      const { data: profile } = await supabase
        .from('user_diagnostic_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setDiagnosticProfile(profile);

      // Fetch existing plan
      const { data: planData } = await supabase
        .from('ai_learning_plans_v2')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData) {
        setPlan({
          planData: planData.plan_data,
          schedule: planData.schedule,
          targetTopics: planData.target_topics as any[] || [],
          dailyTasks: planData.daily_tasks as any[] || [],
          miniTests: planData.mini_tests as any[] || [],
          predictedTimeline: planData.predicted_timeline,
          masteryGoals: planData.mastery_goals,
          ortScoreProjection: planData.ort_score_projection,
          learningStrategy: planData.learning_strategy || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!user || !session) {
      navigate('/login');
      return;
    }
    if (!diagnosticProfile) {
      toast({
        title: language === 'ru' ? 'Нужна диагностика' : 'Diagnostic required',
        description: language === 'ru' ? 'Сначала пройдите диагностический тест.' : 'Please complete the diagnostic test first.',
        variant: 'destructive',
      });
      navigate('/diagnostic-test');
      return;
    }

    setGenerating(true);

    try {
      const toSafeInt = (v: unknown, fallback: number, min: number, max: number) => {
        const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, Math.round(n)));
      };

      // Fetch user data for plan generator
      const [testsRes, lessonsRes, topicsRes] = await Promise.all([
        supabase.from('user_tests').select('*').eq('user_id', user.id),
        supabase.from('user_lesson_progress').select('*').eq('user_id', user.id),
        supabase.from('user_topic_progress').select('*').eq('user_id', user.id),
      ]);

      const safeTarget = toSafeInt(diagnosticProfile?.target_ort_score, 170, 100, 250);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-learning-plan-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          testHistory: testsRes.data || [],
          lessonProgress: lessonsRes.data || [],
          topicMastery: topicsRes.data || [],
          diagnosticProfile,
          targetORTScore: safeTarget,
          language,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const planResult = await response.json();

      // Save to database
      await supabase
        .from('ai_learning_plans_v2')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('ai_learning_plans_v2')
        .insert({
          user_id: user.id,
          plan_data: planResult.planData || planResult,
          schedule: planResult.schedule || {},
          target_topics: planResult.targetTopics || [],
          daily_tasks: planResult.dailyTasks || [],
          mini_tests: planResult.miniTests || [],
          predicted_timeline: planResult.predictedTimeline || {},
          mastery_goals: planResult.masteryGoals || {},
          ort_score_projection: planResult.ortScoreProjection || {},
          learning_strategy: planResult.learningStrategy || '',
        });

      if (error) throw error;

      setPlan({
        planData: planResult.planData || planResult,
        schedule: planResult.schedule || {},
        targetTopics: planResult.targetTopics || [],
        dailyTasks: planResult.dailyTasks || [],
        miniTests: planResult.miniTests || [],
        predictedTimeline: planResult.predictedTimeline || {},
        masteryGoals: planResult.masteryGoals || {},
        ortScoreProjection: planResult.ortScoreProjection || {},
        learningStrategy: planResult.learningStrategy || '',
      });

      toast({
        title: language === 'ru' ? 'План создан!' : 'Plan Generated!',
        description: language === 'ru' ? 'Ваш персональный план готов' : 'Your personalized plan is ready',
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate learning plan",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <main className="container py-8">
          <section>
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>{language === 'ru' ? 'Персональный план' : 'Personal Learning Plan'}</CardTitle>
                <CardDescription>
                  {language === 'ru'
                    ? 'Войдите, чтобы создать и сохранить ваш план подготовки к ОРТ.'
                    : 'Sign in to generate and save your ORT study plan.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={() => navigate('/login')}>{language === 'ru' ? 'Войти' : 'Sign in'}</Button>
                <Button variant="outline" onClick={() => navigate('/signup')}>{language === 'ru' ? 'Регистрация' : 'Sign up'}</Button>
              </CardContent>
            </Card>
          </section>
        </main>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {language === 'ru' ? 'Персональный план обучения' : 'Personal Learning Plan'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {language === 'ru' ? 'AI-адаптированный план с прогнозированием' : 'AI-adapted plan with forecasting'}
            </p>
          </div>
          <Button onClick={generatePlan} disabled={generating}>
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {language === 'ru' ? 'Генерация...' : 'Generating...'}</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> {language === 'ru' ? 'Обновить план' : 'Refresh Plan'}</>
            )}
          </Button>
        </div>

        {!plan ? (
          <Card className="text-center py-12">
            <CardContent>
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {language === 'ru' ? 'План ещё не создан' : 'No Plan Yet'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'ru' 
                  ? 'Нажмите "Обновить план" чтобы AI создал персональный план обучения'
                  : 'Click "Refresh Plan" to have AI create a personalized learning plan'}
              </p>
              <Button onClick={generatePlan} disabled={generating}>
                {language === 'ru' ? 'Создать план' : 'Create Plan'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{language === 'ru' ? 'Обзор' : 'Overview'}</TabsTrigger>
              <TabsTrigger value="schedule">{language === 'ru' ? 'Расписание' : 'Schedule'}</TabsTrigger>
              <TabsTrigger value="forecast">{language === 'ru' ? 'Прогноз' : 'Forecast'}</TabsTrigger>
              <TabsTrigger value="topics">{language === 'ru' ? 'Темы' : 'Topics'}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* ORT Score Projection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {language === 'ru' ? 'Прогноз балла ОРТ' : 'ORT Score Projection'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Сейчас' : 'Current'}</p>
                      <p className="text-3xl font-bold">{plan.ortScoreProjection?.current || '—'}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Через 2 нед.' : 'In 2 weeks'}</p>
                      <p className="text-3xl font-bold text-blue-500">{plan.ortScoreProjection?.in2Weeks || '—'}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Через месяц' : 'In 1 month'}</p>
                      <p className="text-3xl font-bold text-green-500">{plan.ortScoreProjection?.in1Month || '—'}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <p className="text-sm text-muted-foreground">{language === 'ru' ? 'Цель' : 'Target'}</p>
                      <p className="text-3xl font-bold text-primary">{plan.ortScoreProjection?.in2Months || '200'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    {language === 'ru' ? 'Стратегия обучения' : 'Learning Strategy'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{plan.learningStrategy || (language === 'ru' ? 'Стратегия генерируется на основе вашего профиля' : 'Strategy is generated based on your profile')}</p>
                </CardContent>
              </Card>

              {/* Mastery Goals */}
              <div className="grid md:grid-cols-3 gap-4">
                {['shortTerm', 'mediumTerm', 'longTerm'].map((term) => {
                  const goal = plan.masteryGoals?.[term];
                  if (!goal) return null;
                  return (
                    <Card key={term}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {term === 'shortTerm' ? (language === 'ru' ? 'Краткосрочная' : 'Short-term') :
                           term === 'mediumTerm' ? (language === 'ru' ? 'Среднесрочная' : 'Medium-term') :
                           (language === 'ru' ? 'Долгосрочная' : 'Long-term')}
                        </CardTitle>
                        <CardDescription>{goal.duration}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{language === 'ru' ? 'Цель мастерства' : 'Target Mastery'}</span>
                            <span className="font-bold">{goal.targetMastery}%</span>
                          </div>
                          <Progress value={goal.targetMastery} className="h-2" />
                          <div className="flex flex-wrap gap-1 mt-2">
                            {goal.keyTopics?.slice(0, 3).map((topic: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{topic}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {language === 'ru' ? 'Недельное расписание' : 'Weekly Schedule'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.schedule?.dailySchedule && Object.entries(plan.schedule.dailySchedule).map(([day, schedule]: [string, any]) => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="w-24 font-medium capitalize">{day}</div>
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2">
                            {schedule.activities?.map((activity: string, idx: number) => (
                              <Badge key={idx} variant="outline">{activity}</Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {schedule.topics?.join(', ')}
                          </p>
                        </div>
                        <div className="text-sm font-medium">{schedule.duration}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ru' ? 'Задачи на ближайшие дни' : 'Upcoming Tasks'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plan.dailyTasks?.slice(0, 5).map((task: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold">{task.day || idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{task.focusTopic}</p>
                          <p className="text-sm text-muted-foreground">
                            {Array.isArray(task.tasks) ? task.tasks.join(', ') : task.tasks}
                          </p>
                        </div>
                        <Badge variant="secondary">{task.estimatedTime}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {language === 'ru' ? 'Прогнозируемый прогресс' : 'Predicted Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {plan.predictedTimeline && Object.entries(plan.predictedTimeline).map(([week, data]: [string, any]) => (
                      <div key={week} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{week.replace('week', language === 'ru' ? 'Неделя ' : 'Week ')}</span>
                          <Badge>{data.milestone}</Badge>
                        </div>
                        <Progress value={data.expectedMastery} className="h-3" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{data.focusAreas?.join(', ')}</span>
                          <span>{data.expectedMastery}% {language === 'ru' ? 'мастерства' : 'mastery'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {language === 'ru' ? 'Целевые темы' : 'Target Topics'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plan.targetTopics?.map((topic: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{topic.topic}</span>
                          <Badge variant={topic.priority === 'high' ? 'destructive' : topic.priority === 'medium' ? 'default' : 'secondary'}>
                            {topic.priority}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{language === 'ru' ? 'Текущий уровень' : 'Current'}: {topic.currentMastery}%</span>
                            <span>{language === 'ru' ? 'Цель' : 'Target'}: {topic.targetMastery}%</span>
                          </div>
                          <Progress value={topic.currentMastery} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {language === 'ru' ? `Примерно ${topic.weeksToComplete} недель` : `Est. ${topic.weeksToComplete} weeks`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
