import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Play,
  Award,
  Calendar,
  Brain,
  Loader2,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { PointsDisplay } from '@/components/gamification/PointsDisplay';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { LearningTree } from '@/components/gamification/LearningTree';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { MasteryLevel } from '@/components/gamification/MasteryNode';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { XPProgress } from '@/components/gamification/XPProgress';
import { StreakCalendar } from '@/components/gamification/StreakCalendar';
import { MasteryOverview } from '@/components/ai/MasteryOverview';
import { AIRecommendationsWidget } from '@/components/ai/AIRecommendationsWidget';

interface Profile {
  name: string | null;
  streak: number;
  points: number;
  level: number;
}

interface TopicProgress {
  id: string;
  title: string;
  level: MasteryLevel;
  progress?: number;
}

interface LearningPath {
  summary: string;
  recommendedPath: {
    order: number;
    topic: string;
    reason: string;
    estimatedTime: string;
    priority: string;
  }[];
  motivationalMessage: string;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPath, setGeneratingPath] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    if (!user) return;
    
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          name: profileData.name,
          streak: profileData.streak || 0,
          points: profileData.points || 0,
          level: profileData.level || 1,
        });
      }

      // Fetch topics with progress
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('subject', 'mathematics')
        .order('order_index');

      const { data: topicProgressData } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', user.id);

      const progressMap = new Map(topicProgressData?.map(p => [p.topic_id, p]) || []);

      // Map database mastery levels to component mastery levels
      const masteryMap: Record<string, MasteryLevel> = {
        'mastered': 'mastered',
        'in_progress': 'in-progress',
        'weak': 'weak',
        'not_attempted': 'locked',
      };

      const topicsWithProgress: TopicProgress[] = (topicsData || []).map(topic => {
        const progress = progressMap.get(topic.id);
        let level: MasteryLevel = 'locked';
        
        if (progress?.mastery) {
          level = masteryMap[progress.mastery] || 'locked';
        }

        return {
          id: topic.id,
          title: language === 'ru' && topic.title_ru ? topic.title_ru : topic.title,
          level,
          progress: progress?.progress_percentage || 0,
        };
      });

      setTopics(topicsWithProgress);

      // Fetch recent activity (tests and lessons)
      const { data: recentTests } = await supabase
        .from('user_tests')
        .select('*, test:tests(title, title_ru)')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3);

      const { data: recentLessons } = await supabase
        .from('user_lesson_progress')
        .select('*, lesson:lessons(title, title_ru)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      const activity = [
        ...(recentTests || []).map(t => ({
          id: t.id,
          type: 'test',
          title: language === 'ru' && t.test?.title_ru ? t.test.title_ru : t.test?.title,
          time: new Date(t.completed_at!).toLocaleDateString('ru-RU'),
          score: t.score,
        })),
        ...(recentLessons || []).map(l => ({
          id: l.id,
          type: 'lesson',
          title: language === 'ru' && l.lesson?.title_ru ? l.lesson.title_ru : l.lesson?.title,
          time: new Date(l.created_at!).toLocaleDateString('ru-RU'),
          score: null,
        })),
      ].slice(0, 5);

      setRecentActivity(activity);

      // Fetch achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      type AchievementType = 'first_lesson' | 'first_test' | 'streak_3' | 'streak_7' | 'streak_30' | 'mastery_5' | 'mastery_10' | 'perfect_score' | 'early_bird' | 'night_owl';
      
      const achievementsList: { id: AchievementType; title: string; description: string }[] = [
        { id: 'first_lesson', title: 'Первый урок', description: 'Завершите первый урок' },
        { id: 'first_test', title: 'Первый тест', description: 'Завершите первый тест' },
        { id: 'streak_7', title: '7-дневный стрик', description: 'Учитесь 7 дней подряд' },
        { id: 'perfect_score', title: 'Отличник', description: 'Получите 100% на тесте' },
      ];

      const unlockedIds = new Set(achievementsData?.map(a => a.achievement) || []);
      setAchievements(achievementsList.map(a => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
      })));

      // Fetch saved learning path from v2 table (new format) or fallback to v1
      const { data: savedPathV2 } = await supabase
        .from('ai_learning_plans_v2')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (savedPathV2?.plan_data) {
        // Convert v2 format to v1 format for display
        const planData = savedPathV2.plan_data as any;
        setLearningPath({
          summary: savedPathV2.learning_strategy || planData.explanation || '',
          recommendedPath: (planData.weeklyPlan || []).flatMap((day: any, idx: number) => 
            (day.topics || []).map((topic: any, tIdx: number) => ({
              order: idx * 10 + tIdx + 1,
              topic: topic.name,
              reason: topic.priority === 'weak' ? 'Слабая тема - требует внимания' : 'Закрепление',
              estimatedTime: topic.time,
              priority: topic.priority === 'weak' ? 'high' : 'medium',
            }))
          ).slice(0, 5),
          motivationalMessage: planData.explanation || 'Продолжайте заниматься!',
        });
      } else {
        // Fallback to old table
        const { data: savedPath } = await supabase
          .from('ai_learning_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (savedPath?.plan_data) {
          setLearningPath(savedPath.plan_data as unknown as LearningPath);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateLearningPath() {
    if (!user) return;
    
    setGeneratingPath(true);
    try {
      // Get latest completed test (practice test = diagnostic source)
      const { data: latestTest } = await supabase
        .from('user_tests')
        .select('answers, score, total_questions')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let answers = Array.isArray(latestTest?.answers) ? latestTest.answers : [];

      // Fallback to user_answers table
      if (answers.length === 0) {
        const { data: userAnswers } = await supabase
          .from('user_answers')
          .select('*')
          .eq('user_id', user.id)
          .order('answered_at', { ascending: false })
          .limit(30);

        if (userAnswers && userAnswers.length > 0) {
          answers = userAnswers.map((a: any, idx: number) => ({
            questionId: a.question_id || idx + 1,
            topic: a.topic || null,
            isCorrect: a.is_correct,
          }));
        }
      }

      if (answers.length === 0) {
        toast({
          title: 'Нет данных',
          description: 'Сначала пройди тест в разделе «Тесты».',
          variant: 'destructive',
        });
        setGeneratingPath(false);
        return;
      }

      const diagnosticAnswers = answers.map((a: any, idx: number) => ({
        questionId: a.questionId || a.question_id || idx + 1,
        topic: a.topic || null,
        isCorrect: a.correct ?? a.isCorrect ?? false,
      }));

      // Use the ai-learning-plan-v2 function with diagnosticAnswers
      const { data, error } = await supabase.functions.invoke('ai-learning-plan-v2', {
        body: {
          diagnosticAnswers,
          language,
        },
      });

      if (error) throw error;

      // Convert to display format
      const planData = data.planData || data;
      setLearningPath({
        summary: data.learningStrategy || data.explanation || '',
        recommendedPath: (planData.weeklyPlan || data.weeklyPlan || []).flatMap((day: any, idx: number) => 
          (day.topics || []).map((topic: any, tIdx: number) => ({
            order: idx * 10 + tIdx + 1,
            topic: topic.name,
            reason: topic.priority === 'weak' ? 'Слабая тема - требует внимания' : 'Закрепление',
            estimatedTime: topic.time,
            priority: topic.priority === 'weak' ? 'high' : 'medium',
          }))
        ).slice(0, 5),
        motivationalMessage: data.explanation || planData.explanation || 'Продолжайте заниматься!',
      });

      // Save the learning path to v2 table
      await supabase
        .from('ai_learning_plans_v2')
        .upsert({
          user_id: user.id,
          plan_data: data.planData || data,
          schedule: data.schedule,
          target_topics: data.targetTopics,
          daily_tasks: data.dailyTasks,
          mini_tests: data.miniTests,
          predicted_timeline: data.predictedTimeline,
          mastery_goals: data.masteryGoals,
          ort_score_projection: data.ortScoreProjection,
          learning_strategy: data.learningStrategy || data.explanation,
          is_active: true,
          generated_at: new Date().toISOString(),
        });

      toast({
        title: 'План обучения создан!',
        description: 'AI создал персональный план на основе вашего прогресса.',
      });
    } catch (error) {
      console.error('Error generating learning path:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать план обучения. Проверьте, прошли ли вы тест.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPath(false);
    }
  }

  const weeklyProgress = Math.min(100, ((profile?.points || 0) % 100));
  const weeklyGoal = 100;

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t.dashboard.welcome}, {profile?.name || 'Студент'}! 👋</h1>
            <p className="text-muted-foreground">{t.dashboard.yourProgress}</p>
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge streak={profile?.streak || 0} />
            <PointsDisplay points={profile?.points || 0} />
            <LevelBadge level={profile?.level || 1} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="interactive" className="group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Play className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t.dashboard.continueLesson}</h3>
                <p className="text-sm text-muted-foreground">
                  {recentActivity.find(a => a.type === 'lesson')?.title || 'Начните новый урок'}
                </p>
              </div>
            </CardContent>
            <Button variant="ghost" className="w-full rounded-t-none border-t" asChild>
              <Link to="/lessons">
                {t.common.continue}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>

          <Card variant="interactive" className="group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success transition-colors group-hover:bg-success group-hover:text-success-foreground">
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t.dashboard.startTest}</h3>
                <p className="text-sm text-muted-foreground">ОРТ Математика</p>
              </div>
            </CardContent>
            <Button variant="ghost" className="w-full rounded-t-none border-t" asChild>
              <Link to="/tests">
                Start
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>

          <Card variant="interactive" className="group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Brain className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">AI Tutor</h3>
                <p className="text-sm text-muted-foreground">Ask questions</p>
              </div>
            </CardContent>
            <Button variant="ghost" className="w-full rounded-t-none border-t" asChild>
              <Link to="/ai-tutor">
                Chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>

          <Card variant="interactive" className="group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning transition-colors group-hover:bg-warning group-hover:text-warning-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">My Plan</h3>
                <p className="text-sm text-muted-foreground">AI Learning Plan</p>
              </div>
            </CardContent>
            <Button variant="ghost" className="w-full rounded-t-none border-t" asChild>
              <Link to="/learning-plan">
                View
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Weekly Goal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    {t.dashboard.weeklyGoal}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {weeklyProgress}/{weeklyGoal} XP
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={(weeklyProgress / weeklyGoal) * 100} className="h-3" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Еще {weeklyGoal - weeklyProgress} XP до цели!
                </p>
              </CardContent>
            </Card>

            {/* Learning Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Дерево обучения - Математика
                </CardTitle>
                <CardDescription>
                  Ваш прогресс по темам
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topics.length > 0 ? (
                  <LearningTree 
                    topics={topics}
                    onTopicClick={(id) => console.log('Topic clicked:', id)}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Начните изучать уроки, чтобы увидеть прогресс
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  {t.dashboard.recentActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            activity.type === 'test' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
                          }`}>
                            {activity.type === 'test' ? (
                              <Target className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                        {activity.score !== null && (
                          <Badge variant="success">{activity.score}%</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Нет недавней активности
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

{/* Sidebar */}
          <div className="space-y-8">
            {/* Mastery Overview */}
            <MasteryOverview compact />

            {/* AI Recommendations */}
            <Card variant="accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Рекомендации
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {learningPath ? (
                  <>
                    <p className="text-sm">{learningPath.summary}</p>
                    {learningPath.recommendedPath?.slice(0, 2).map((item, i) => (
                      <div key={i} className="rounded-lg border border-border/50 p-3">
                        <p className="font-medium text-sm">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={generateLearningPath}
                      disabled={generatingPath}
                    >
                      {generatingPath ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Обновить план
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      AI создаст персональный план обучения на основе вашего прогресса
                    </p>
                    <Button 
                      variant="accent" 
                      size="sm" 
                      className="w-full"
                      onClick={generateLearningPath}
                      disabled={generatingPath}
                    >
                      {generatingPath ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Создать план
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Suggested Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  {t.dashboard.suggestedLessons}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningPath?.recommendedPath?.slice(0, 3).map((item, i) => (
                  <Link
                    key={i}
                    to="/lessons"
                    className="block rounded-lg border border-border p-3 transition-all hover:border-accent hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          Математика • {item.estimatedTime}
                        </p>
                      </div>
                      <Badge variant={item.priority === 'high' ? 'destructive' : 'ghost'}>
                        {item.priority === 'high' ? 'Важно' : 'Рекомендуется'}
                      </Badge>
                    </div>
                  </Link>
                )) || (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    Создайте AI план для рекомендаций
                  </p>
                )}
              </CardContent>
            </Card>

            {/* XP Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Прогресс XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <XPProgress 
                  currentXP={profile?.points || 0} 
                  level={profile?.level || 1} 
                />
              </CardContent>
            </Card>

            {/* Streak Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-warning" />
                  Ваш стрик
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StreakCalendar streak={profile?.streak || 0} />
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Leaderboard limit={5} showTabs={false} />

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  {t.dashboard.achievements}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                    progress={achievement.progress}
                  />
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/profile">
                    Все достижения
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
