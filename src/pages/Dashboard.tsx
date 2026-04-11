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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AchievementsPanel } from '@/components/gamification/AchievementsPanel';

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
  { uuid: '00000000-0000-0000-0000-000000000001', name: 'Вариант 1' },
  { uuid: '00000000-0000-0000-0000-000000000002', name: 'Вариант 2' },
  { uuid: '00000000-0000-0000-0000-000000000003', name: 'Вариант 3' },
  { uuid: '00000000-0000-0000-0000-000000000004', name: 'Вариант 4' },
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
  testHistory: { date: string; score: number; total: number }[];
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
};

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

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
        supabase.from('profiles').select('name').eq('id', user.id).maybeSingle(),
        supabase.from('user_tests').select('id, test_id, score, total_questions, completed_at, created_at, time_taken_seconds')
           .eq('user_id', user.id).not('completed_at', 'is', null).order('completed_at', { ascending: true }),
        supabase.from('user_answers').select('question_id, topic, is_correct, answered_at').eq('user_id', user.id),
        supabase.from('question_attempts').select('question_id, topic, is_correct, time_spent_seconds, created_at')
          .eq('user_id', user.id),
        supabase.from('user_sessions').select('id, session_start, duration_seconds').eq('user_id', user.id),
      ]);

      setProfileName(profileRes.data?.name || null);

      const tests: TestAttempt[] = testsRes.data || [];
      setRawTests(tests);
      const userAnswers = answersRes.data || [];
      const questionAttempts = attemptsRes.data || [];
      const sessions = sessionsRes.data || [];

      // --- Improvement (convert raw scores to percentages) ---
      const firstTest = tests.length > 0 ? tests[0] : null;
      const latestTest = tests.length > 0 ? tests[tests.length - 1] : null;
      const toPercent = (t: TestAttempt | null) => {
        if (!t || t.score === null || t.score === undefined) return null;
        const total = t.total_questions || 1;
        const raw = t.score > total ? t.score : Math.round((t.score / total) * 100);
        return Math.max(0, Math.min(100, raw));
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
      const testHistory = tests.map(t => {
        const total = t.total_questions ?? 0;
        const rawScore = t.score ?? 0;
        // Normalize: if score > total, it's already a percentage
        const safeScore = total > 0 && rawScore <= total ? rawScore : (total > 0 ? Math.round((rawScore / 100) * total) : rawScore);
        return {
          date: t.completed_at ? new Date(t.completed_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '',
          score: safeScore,
          total,
        };
      });

      // --- Topic performance from question_attempts + user_answers ---
      const topicMap = new Map<string, { correct: number; total: number }>();
      const addToTopicMap = (topic: string | null, isCorrect: boolean) => {
        const t = topic || 'Без темы';
        const entry = topicMap.get(t) || { correct: 0, total: 0 };
        entry.total++;
        if (isCorrect) entry.correct++;
        topicMap.set(t, entry);
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
      const lastSession = sessions.length > 0
        ? sessions.sort((a, b) => new Date(b.session_start).getTime() - new Date(a.session_start).getTime())[0]
        : null;

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
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
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
          <h1 className="text-3xl font-bold">Аналитика обучения</h1>
          <p className="text-muted-foreground">
            {profileName ? `${profileName} — ` : ''}Данные на основе реальных результатов
          </p>
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Нет данных для анализа</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Пройдите тест в разделе «Тесты», чтобы увидеть аналитику вашего обучения.
              </p>
              <Button asChild>
                <Link to="/tests">
                  <Target className="mr-2 h-4 w-4" />
                  Пройти тест
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Nav */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction icon={<Play className="h-6 w-6" />} title="Уроки" sub="Продолжить обучение" to="/lessons" color="accent" />
              <QuickAction icon={<Target className="h-6 w-6" />} title="Тесты" sub="Пройти тест" to="/tests" color="success" />
              <QuickAction icon={<Brain className="h-6 w-6" />} title="AI Tutor" sub="Задать вопрос" to="/ai-tutor" color="primary" />
              <QuickAction icon={<Calendar className="h-6 w-6" />} title="Мой план" sub="AI план обучения" to="/learning-plan" color="warning" />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-8">
                {/* ===== IMPROVEMENT SECTION ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      Прогресс / Улучшение
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <MetricCard
                        label="Первый тест"
                        value={analytics.firstTestScore !== null ? `${analytics.firstTestScore}%` : '—'}
                        sub="Начальный результат"
                      />
                      <MetricCard
                        label="Последний тест"
                        value={analytics.latestTestScore !== null ? `${analytics.latestTestScore}%` : '—'}
                        sub="Текущий результат"
                      />
                      <MetricCard
                        label="Улучшение"
                        value={analytics.improvement !== null
                          ? `${analytics.improvement > 0 ? '+' : ''}${analytics.improvement}%`
                          : '—'}
                        sub={analytics.improvementPercent !== null
                          ? `${analytics.improvementPercent > 0 ? '+' : ''}${analytics.improvementPercent}% рост`
                          : 'Пройдите 2+ тестов'}
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
                        Результаты по вариантам
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {TEST_VARIANTS.map(v => {
                          const vTests = rawTests.filter(t => t.test_id === v.uuid);
                          if (vTests.length === 0) return (
                            <div key={v.uuid} className="rounded-lg border border-border p-4 text-center">
                              <p className="font-medium mb-1">{v.name}</p>
                              <p className="text-sm text-muted-foreground">Нет попыток</p>
                            </div>
                          );
                          const best = Math.max(...vTests.map((t: any) => t.score ?? 0));
                          const avg = Math.round(vTests.reduce((s: number, t: any) => s + (t.score ?? 0), 0) / vTests.length);
                          return (
                            <div key={v.uuid} className="rounded-lg border border-border p-4">
                              <p className="font-medium mb-2">{v.name}</p>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Попыток</span><span className="font-semibold">{vTests.length}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Лучший</span><span className="font-semibold text-accent">{best}%</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Средний</span><span className="font-semibold">{avg}%</span></div>
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
                        Динамика результатов
                      </CardTitle>
                      <CardDescription>{analytics.testHistory.length} тестов пройдено</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.testHistory.map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-16 shrink-0">{t.date}</span>
                            <div className="flex-1">
                              <Progress value={t.total > 0 ? (t.score / t.total) * 100 : t.score} className="h-3" />
                            </div>
                            <span className="text-sm font-medium w-14 text-right">
                              {t.total > 0 ? `${t.score}/${t.total}` : `${t.score}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ===== TOPIC PERFORMANCE ===== */}
                {analytics.topicAccuracy.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-accent" />
                        Точность по темам
                      </CardTitle>
                      <CardDescription>От слабых к сильным</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.topicAccuracy.map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium truncate">{t.topic}</span>
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

                {/* ===== ERROR ANALYSIS ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Анализ ошибок
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                      <MetricCard
                        label="Всего вопросов"
                        value={String(analytics.totalQuestions)}
                        sub={`${analytics.totalQuestions - analytics.totalIncorrect} правильных`}
                      />
                      <MetricCard
                        label="Ошибки"
                        value={String(analytics.totalIncorrect)}
                        sub={analytics.totalQuestions > 0
                          ? `${Math.round((analytics.totalIncorrect / analytics.totalQuestions) * 100)}% ошибок`
                          : 'Нет данных'}
                        highlight={analytics.totalIncorrect > 0 ? 'negative' : 'positive'}
                      />
                    </div>
                    {analytics.weakTopics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Слабые темы (точность &lt; 60%)</p>
                        <div className="space-y-2">
                          {analytics.weakTopics.map((t, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                              <span className="text-sm font-medium">{t.topic}</span>
                              <Badge variant="destructive">{t.accuracy}%</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analytics.weakTopics.length === 0 && analytics.topicAccuracy.length > 0 && (
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">Все темы выше 60% — отличный результат!</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* ===== LEARNING EFFICIENCY ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-accent" />
                      Эффективность
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Вопросов решено</span>
                      <span className="font-semibold">{analytics.totalQuestionsSolved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ср. время на вопрос</span>
                      <span className="font-semibold">
                        {analytics.avgTimePerQuestion !== null ? `${analytics.avgTimePerQuestion}с` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Время в сессиях</span>
                      <span className="font-semibold">
                        {analytics.totalStudySeconds > 0 ? formatDuration(analytics.totalStudySeconds) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Тестов пройдено</span>
                      <span className="font-semibold">{analytics.testHistory.length}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* ===== RETENTION / ACTIVITY ===== */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-accent" />
                      Активность
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Учебных сессий</span>
                      <span className="font-semibold">{analytics.totalSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Дней активности</span>
                      <span className="font-semibold">{analytics.daysActive}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Последняя активность</span>
                      <span className="font-semibold text-sm">
                        {analytics.lastActivityAt
                          ? new Date(analytics.lastActivityAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                          : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Быстрые действия</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/tests">
                        <Target className="mr-2 h-4 w-4" />
                        Пройти новый тест
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/practice">
                        <Dumbbell className="mr-2 h-4 w-4" />
                        Практика
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/learning-plan">
                        <Brain className="mr-2 h-4 w-4" />
                        AI План обучения
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link to="/profile">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Мой профиль
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Achievements - full width below */}
            <div className="mt-8">
              <AchievementsPanel />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

/* ===== Sub-components ===== */

function QuickAction({ icon, title, sub, to, color }: { icon: React.ReactNode; title: string; sub: string; to: string; color: string }) {
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
          Перейти
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
