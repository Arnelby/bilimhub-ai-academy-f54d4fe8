import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  ArrowRight,
  Play,
  Calendar,
  Brain,
  Loader2,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Hash,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AchievementsPanel } from '@/components/gamification/AchievementsPanel';
import { useUserGroup } from '@/hooks/useUserGroup';
import { translateTopic } from '@/lib/topicTranslations';
import { parseScore } from '@/lib/scoreUtils';

interface TestAttempt {
  id: string;
  test_id: string;
  score: number | null;
  total_questions: number | null;
  completed_at: string | null;
  created_at: string | null;
  time_taken_seconds: number | null;
}

const TEST_VARIANTS = [
  { uuid: '00000000-0000-0000-0000-000000000001', name: 'Variant 1' },
  { uuid: '00000000-0000-0000-0000-000000000002', name: 'Variant 2' },
  { uuid: '00000000-0000-0000-0000-000000000003', name: 'Variant 3' },
  { uuid: '00000000-0000-0000-0000-000000000004', name: 'Variant 4' },
];

interface TopicAccuracy {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface AnalyticsData {
  // Improvement
  firstTestScore: number | null;
  latestTestScore: number | null;
  improvement: number | null;
  improvementPercent: number | null;
  // Score trend
  testHistory: { date: string; score: number; total: number; percentage: number }[];
  // Topic performance
  topicAccuracy: TopicAccuracy[];
  // Error analysis
  totalIncorrect: number;
  totalQuestions: number;
  weakTopics: TopicAccuracy[];
  // Learning efficiency
  totalQuestionsSolved: number;
  avgTimePerQuestion: number | null;
  totalStudySeconds: number;
  // Retention
  totalSessions: number;
  lastActivityAt: string | null;
  daysActive: number;
  testsCompleted: number;
  streakDays: number;
}

const EMPTY_ANALYTICS: AnalyticsData = {
  firstTestScore: null,
  latestTestScore: null,
  improvement: null,
  improvementPercent: null,
  testHistory: [],
  topicAccuracy: [],
  totalIncorrect: 0,
  totalQuestions: 0,
  weakTopics: [],
  totalQuestionsSolved: 0,
  avgTimePerQuestion: null,
  totalStudySeconds: 0,
  totalSessions: 0,
  lastActivityAt: null,
  daysActive: 0,
  testsCompleted: 0,
  streakDays: 0,
};

export default function Dashboard() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAI, isControl } = useUserGroup();

  const [profileName, setProfileName] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>(EMPTY_ANALYTICS);
  const [rawTests, setRawTests] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  async function fetchAnalytics() {
    if (!user) return;
    try {
      // Parallel fetches
      const [profileRes, testsRes, answersRes, attemptsRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('name, full_name').eq('id', user.id).maybeSingle(),
        supabase.from('user_tests').select('id, test_id, score, total_questions, completed_at, created_at, time_taken_seconds')
           .eq('user_id', user.id).not('completed_at', 'is', null).order('completed_at', { ascending: true }),
        supabase.from('user_answers').select('question_id, topic, is_correct, answered_at').eq('user_id', user.id),
        supabase.from('question_attempts').select('question_id, topic, is_correct, time_spent_seconds, created_at')
          .eq('user_id', user.id),
        supabase.from('user_sessions').select('id, session_start, duration_seconds').eq('user_id', user.id),
      ]);

      setProfileName(profileRes.data?.full_name || profileRes.data?.name || null);

      const tests: TestAttempt[] = testsRes.data || [];
      setRawTests(tests);
      const userAnswers = answersRes.data || [];
      const questionAttempts = attemptsRes.data || [];
      const sessions = sessionsRes.data || [];

      // --- Improvement (using parseScore for consistent handling) ---
      const firstTest = tests.length > 0 ? tests[0] : null;
      const latestTest = tests.length > 0 ? tests[tests.length - 1] : null;
      const toPercent = (t: TestAttempt | null) => {
        if (!t || t.score === null || t.score === undefined) return null;
        return parseScore(t.score, t.total_questions).percentage;
      };
      const firstScore = toPercent(firstTest);
      const latestScore = toPercent(latestTest);
      let improvement: number | null = null;
      let improvementPercent: number | null = null;
      if (firstScore !== null && latestScore !== null && tests.length >= 2) {
        improvement = latestScore - firstScore;
        improvementPercent = firstScore > 0 ? Math.round((improvement / firstScore) * 100) : null;
      }

      // --- Score trend ---
      const localeMap = { en: 'en-US', ru: 'ru-RU', kg: 'ru-RU' } as const;
      const dateLocale = localeMap[language as keyof typeof localeMap] || 'en-US';
      const testHistory = tests.map(t => {
        const p = parseScore(t.score, t.total_questions);
        return {
          date: t.completed_at ? new Date(t.completed_at).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' }) : '',
          score: p.correct,
          total: p.total,
          percentage: p.percentage,
        };
      });

      // --- Topic performance from question_attempts + user_answers ---
      const topicMap = new Map<string, { correct: number; total: number }>();
      const noTopicLabel = t('topics.noTopic');
      const addToTopicMap = (topic: string | null, isCorrect: boolean) => {
        const tk = topic || noTopicLabel;
        const entry = topicMap.get(tk) || { correct: 0, total: 0 };
        entry.total++;
        if (isCorrect) entry.correct++;
        topicMap.set(tk, entry);
      };
      questionAttempts.forEach(a => addToTopicMap(a.topic, a.is_correct));
      userAnswers.forEach(a => addToTopicMap(a.topic, a.is_correct));

      const topicAccuracy: TopicAccuracy[] = Array.from(topicMap.entries())
        .map(([topic, data]) => ({
          topic,
          correct: data.correct,
          total: data.total,
          accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.accuracy - b.accuracy);

      // --- Error analysis ---
      const totalQuestions = topicAccuracy.reduce((s, t) => s + t.total, 0);
      const totalCorrect = topicAccuracy.reduce((s, t) => s + t.correct, 0);
      const totalIncorrect = totalQuestions - totalCorrect;
      const weakTopics = topicAccuracy.filter(t => t.accuracy < 60).slice(0, 5);

      // --- Efficiency ---
      const totalTimeSec = questionAttempts.reduce((s, a) => s + (a.time_spent_seconds || 0), 0);
      const avgTime = questionAttempts.length > 0 ? Math.round(totalTimeSec / questionAttempts.length) : null;

      // --- Retention ---
      const totalStudySeconds = sessions.reduce((s, se) => s + (se.duration_seconds || 0), 0);
      const uniqueDays = new Set(sessions.map(s => new Date(s.session_start).toDateString()));
      // Also count test days as activity
      tests.forEach(t => { if (t.completed_at) uniqueDays.add(new Date(t.completed_at).toDateString()); });
      const lastSession = sessions.length > 0
        ? sessions.sort((a, b) => new Date(b.session_start).getTime() - new Date(a.session_start).getTime())[0]
        : null;

      // Streak calculation: consecutive days ending today or yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sortedDays = Array.from(uniqueDays).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
      let streakDays = 0;
      if (sortedDays.length > 0) {
        const diffFromToday = Math.floor((today.getTime() - sortedDays[0].getTime()) / 86400000);
        if (diffFromToday <= 1) {
          streakDays = 1;
          for (let i = 1; i < sortedDays.length; i++) {
            const diff = Math.floor((sortedDays[i - 1].getTime() - sortedDays[i].getTime()) / 86400000);
            if (diff === 1) streakDays++;
            else break;
          }
        }
      }

      setAnalytics({
        firstTestScore: firstScore,
        latestTestScore: latestScore,
        improvement,
        improvementPercent,
        testHistory,
        topicAccuracy,
        totalIncorrect,
        totalQuestions,
        weakTopics,
        totalQuestionsSolved: totalQuestions,
        avgTimePerQuestion: avgTime,
        totalStudySeconds,
        totalSessions: sessions.length,
        lastActivityAt: lastSession?.session_start || latestTest?.completed_at || null,
        daysActive: uniqueDays.size,
        testsCompleted: tests.length,
        streakDays,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return language === 'en' ? `${h}h ${m}m` : `${h}ч ${m}м`;
    return language === 'en' ? `${m}m` : `${m}м`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  const hasData = analytics.totalQuestions > 0 || analytics.testHistory.length > 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('dashboardPage.title')}</h1>
          <p className="text-muted-foreground">
            {profileName ? `${profileName} — ` : ''}{t('dashboardPage.subtitle')}
          </p>
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('dashboardPage.noDataTitle')}</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {t('dashboardPage.noDataBody')}
              </p>
              <Button asChild>
                <Link to="/tests">
                  <Target className="mr-2 h-4 w-4" />
                  {t('dashboardPage.takeTest')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Nav */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction icon={<Play className="h-6 w-6" />} title={t('dashboardPage.quick.lessons')} sub={t('dashboardPage.quick.lessonsSub')} to="/lessons" color="accent" goLabel={t('dashboardPage.quick.go')} />
              <QuickAction icon={<Target className="h-6 w-6" />} title={t('dashboardPage.quick.tests')} sub={t('dashboardPage.quick.testsSub')} to="/tests" color="success" goLabel={t('dashboardPage.quick.go')} />
              {isAI && <QuickAction icon={<Brain className="h-6 w-6" />} title={t('dashboardPage.quick.aiTutor')} sub={t('dashboardPage.quick.aiTutorSub')} to="/ai-tutor" color="primary" goLabel={t('dashboardPage.quick.go')} />}
              {isAI && <QuickAction icon={<Calendar className="h-6 w-6" />} title={t('dashboardPage.quick.myPlan')} sub={t('dashboardPage.quick.myPlanSub')} to="/learning-plan" color="warning" goLabel={t('dashboardPage.quick.go')} />}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-8">
                {/* ===== IMPROVEMENT SECTION ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      {t('dashboardPage.improvement.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <MetricCard
                        label={t('dashboardPage.improvement.first')}
                        value={analytics.firstTestScore !== null ? `${analytics.firstTestScore}%` : '—'}
                        sub={t('dashboardPage.improvement.firstSub')}
                      />
                      <MetricCard
                        label={t('dashboardPage.improvement.latest')}
                        value={analytics.latestTestScore !== null ? `${analytics.latestTestScore}%` : '—'}
                        sub={t('dashboardPage.improvement.latestSub')}
                      />
                      <MetricCard
                        label={t('dashboardPage.improvement.delta')}
                        value={analytics.improvement !== null
                          ? `${analytics.improvement > 0 ? '+' : ''}${analytics.improvement}%`
                          : '—'}
                        sub={analytics.improvementPercent !== null
                          ? t('dashboardPage.improvement.deltaSubGrowth', { value: `${analytics.improvementPercent > 0 ? '+' : ''}${analytics.improvementPercent}` })
                          : t('dashboardPage.improvement.deltaSubNeed')}
                        highlight={analytics.improvement !== null ? (analytics.improvement >= 0 ? 'positive' : 'negative') : undefined}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ===== PER-TEST COMPARISON ===== */}
                {analytics.testHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-accent" />
                        {t('dashboardPage.variants.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {TEST_VARIANTS.map(v => {
                          const vTests = rawTests.filter(t => t.test_id === v.uuid);
                          if (vTests.length === 0) return (
                            <div key={v.uuid} className="rounded-lg border border-border p-4 text-center">
                              <p className="font-medium mb-1">{v.name}</p>
                              <p className="text-sm text-muted-foreground">{t('dashboardPage.variants.noAttempts')}</p>
                            </div>
                          );
                          const best = Math.max(...vTests.map((t: any) => parseScore(t.score, t.total_questions).percentage));
                          const avg = Math.round(vTests.reduce((s: number, t: any) => s + parseScore(t.score, t.total_questions).percentage, 0) / vTests.length);
                          return (
                            <div key={v.uuid} className="rounded-lg border border-border p-4">
                              <p className="font-medium mb-2">{v.name}</p>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboardPage.variants.attempts')}</span><span className="font-semibold">{vTests.length}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboardPage.variants.best')}</span><span className="font-semibold text-accent">{best}%</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('dashboardPage.variants.average')}</span><span className="font-semibold">{avg}%</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ===== SCORE TREND ===== */}
                {analytics.testHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-accent" />
                        {t('dashboardPage.trend.title')}
                      </CardTitle>
                      <CardDescription>{t('dashboardPage.trend.subtitle', { count: analytics.testHistory.length })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.testHistory.map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-16 shrink-0">{t.date}</span>
                            <div className="flex-1">
                              <Progress value={t.percentage} className="h-3" />
                            </div>
                            <span className="text-sm font-medium w-20 text-right">
                              {t.score}/{t.total} ({t.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ===== TOPIC PERFORMANCE (AI only) ===== */}
                {analytics.topicAccuracy.length > 0 && isAI && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-accent" />
                        {t('dashboardPage.topicAccuracy.title')}
                      </CardTitle>
                      <CardDescription>{t('dashboardPage.topicAccuracy.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.topicAccuracy.map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate">{translateTopic(t.topic, language as 'en' | 'ru' | 'kg')}</span>
                                <span className="text-sm text-muted-foreground ml-2 shrink-0">
                                  {t.correct}/{t.total} ({t.accuracy}%)
                                </span>
                              </div>
                              <Progress
                                value={t.accuracy}
                                className={`h-2 ${t.accuracy < 40 ? '[&>div]:bg-destructive' : t.accuracy < 70 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ===== ERROR ANALYSIS (AI only) ===== */}
                {isAI && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      {t('dashboardPage.errors.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                      <MetricCard
                        label={t('dashboardPage.errors.totalQuestions')}
                        value={String(analytics.totalQuestions)}
                        sub={t('dashboardPage.errors.correctSuffix', { n: analytics.totalQuestions - analytics.totalIncorrect })}
                      />
                      <MetricCard
                        label={t('dashboardPage.errors.errors')}
                        value={String(analytics.totalIncorrect)}
                        sub={analytics.totalQuestions > 0
                          ? t('dashboardPage.errors.errorsPercent', { n: Math.round((analytics.totalIncorrect / analytics.totalQuestions) * 100) })
                          : t('dashboardPage.errors.noData')}
                        highlight={analytics.totalIncorrect > 0 ? 'negative' : 'positive'}
                      />
                    </div>
                {analytics.weakTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">{t('dashboardPage.errors.weakTopicsTitle')}</p>
                        <div className="space-y-2">
                          {analytics.weakTopics.map((tt, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                              <span className="text-sm font-medium">{translateTopic(tt.topic, language as 'en' | 'ru' | 'kg')}</span>
                              <Badge variant="destructive">{tt.accuracy}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analytics.weakTopics.length === 0 && analytics.topicAccuracy.length > 0 && (
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">{t('dashboardPage.errors.allGood')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* ===== LEARNING EFFICIENCY ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      {t('dashboardPage.efficiency.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.efficiency.questionsSolved')}</span>
                      <span className="font-semibold">{analytics.totalQuestionsSolved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.efficiency.avgTime')}</span>
                      <span className="font-semibold">
                        {analytics.avgTimePerQuestion !== null ? `${analytics.avgTimePerQuestion}${language === 'en' ? 's' : 'с'}` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.efficiency.sessionTime')}</span>
                      <span className="font-semibold">
                        {analytics.totalStudySeconds > 0 ? formatDuration(analytics.totalStudySeconds) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.efficiency.testsCompleted')}</span>
                      <span className="font-semibold">{analytics.testHistory.length}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* ===== RETENTION / ACTIVITY ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-accent" />
                      {t('dashboardPage.activity.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.streakDays > 0 && (
                      <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 text-center">
                        <p className="text-sm font-medium text-accent">
                          {t('dashboardPage.activity.streak', { days: analytics.streakDays })}
                        </p>
                      </div>
                    )}
                    {analytics.testsCompleted > 0 && (
                      <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-center">
                        <p className="text-sm font-medium text-success">
                          {t('dashboardPage.activity.testsDone', { n: analytics.testsCompleted })}
                        </p>
                      </div>
                    )}
                    {analytics.improvement !== null && analytics.improvement > 0 && (
                      <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                        <p className="text-sm font-medium text-primary">
                          {t('dashboardPage.activity.improved', { n: analytics.improvement })}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.activity.sessions')}</span>
                      <span className="font-semibold">{analytics.totalSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.activity.daysActive')}</span>
                      <span className="font-semibold">{analytics.daysActive}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.activity.streakDays')}</span>
                      <span className="font-semibold">{analytics.streakDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('dashboardPage.activity.lastActivity')}</span>
                      <span className="font-semibold text-sm">
                        {analytics.lastActivityAt
                          ? new Date(analytics.lastActivityAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', { day: '2-digit', month: 'short' })
                          : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick links */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dashboardPage.quickActions.title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/tests">
                        <Target className="mr-2 h-4 w-4" />
                        {t('dashboardPage.quickActions.newTest')}
                      </Link>
                    </Button>
                    {isAI && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/practice">
                          <Dumbbell className="mr-2 h-4 w-4" />
                          {t('dashboardPage.quickActions.practice')}
                        </Link>
                      </Button>
                    )}
                    {isAI && (
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link to="/learning-plan">
                          <Brain className="mr-2 h-4 w-4" />
                          {t('dashboardPage.quickActions.aiPlan')}
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/profile">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {t('dashboardPage.quickActions.myProfile')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Achievements - collapsed by default */}
            <details className="mt-8 group rounded-lg border bg-card">
              <summary className="cursor-pointer p-4 text-sm font-medium flex items-center justify-between select-none hover:bg-muted/50 rounded-lg">
                <span>{t('dashboardPage.achievementsCollapsed')}</span>
                <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="p-4 pt-0">
                <AchievementsPanel />
              </div>
            </details>
          </>
        )}
      </div>
    </Layout>
  );
}

/* ===== Sub-components ===== */

function QuickAction({ icon, title, sub, to, color, goLabel }: { icon: React.ReactNode; title: string; sub: string; to: string; color: string; goLabel: string }) {
  return (
    <Card variant="interactive" className="group">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${color}/10 text-${color} transition-colors group-hover:bg-${color} group-hover:text-${color}-foreground`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
      <Button variant="ghost" className="w-full rounded-t-none border-t" asChild>
        <Link to={to}>
          {goLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
}

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 text-center">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight === 'positive' ? 'text-success' : highlight === 'negative' ? 'text-destructive' : ''}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
