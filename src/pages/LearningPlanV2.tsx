import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle, ArrowRight,
  BookOpen, Trophy, Clock, XCircle, Target, TrendingUp, TrendingDown, Sparkles, Video, Play
} from "lucide-react";
import { TEST_CONFIG } from "@/lib/mathTestConfig";
import { Link } from "react-router-dom";
import { translateTopic, parseQuestionId } from "@/lib/topicTranslations";

interface RecommendedLesson {
  id: string;
  title_ru: string | null;
  title: string;
  youtube_url: string;
  topicTitle: string;
}

interface MistakeQuestion {
  questionNumber: string;
  topic: string | null;
  testId: string;
}

interface TopicStat {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface TestAnalysis {
  testName: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  strongTopics: TopicStat[];
  mediumTopics: TopicStat[];
  weakTopics: TopicStat[];
}

export default function LearningPlanV2() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { language } = useLanguage();

  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[] | null>(null);
  const [mistakes, setMistakes] = useState<MistakeQuestion[]>([]);

  useEffect(() => {
    if (user) loadAnalysis();
    else setLoading(false);
  }, [user]);

  const loadAnalysis = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Find latest completed test
      const { data: latestAttempt } = await supabase
        .from('user_tests')
        .select('id, test_id, score, total_questions, time_taken_seconds, completed_at')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestAttempt) {
        setLoading(false);
        return;
      }

      // Determine test name from config
      const matchedConfig = Object.entries(TEST_CONFIG).find(([, c]) => c.uuid === latestAttempt.test_id);
      const testName = matchedConfig ? matchedConfig[1].name : 'Тест';

      // 2. Get topic-level data from question_attempts
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('topic, is_correct')
        .eq('user_id', user.id)
        .eq('test_attempt_id', latestAttempt.id);

      // Fallback to user_answers if no question_attempts
      let topicData: { topic: string | null; is_correct: boolean }[] = attempts || [];

      if (topicData.length === 0) {
        const testIdStr = matchedConfig ? `math_test_${matchedConfig[0]}` : '';
        if (testIdStr) {
          const { data: userAnswers } = await supabase
            .from('user_answers')
            .select('topic, is_correct')
            .eq('user_id', user.id)
            .eq('test_id', testIdStr);
          topicData = userAnswers || [];
        }
      }

      // 3. Calculate topic accuracy
      const topicMap = new Map<string, { correct: number; total: number }>();
      for (const a of topicData) {
        const t = a.topic;
        if (!t) continue; // skip null topics
        const entry = topicMap.get(t) || { correct: 0, total: 0 };
        entry.total++;
        if (a.is_correct) entry.correct++;
        topicMap.set(t, entry);
      }

      const strong: TopicStat[] = [];
      const medium: TopicStat[] = [];
      const weak: TopicStat[] = [];

      topicMap.forEach((data, topic) => {
        const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        const stat: TopicStat = { topic, total: data.total, correct: data.correct, accuracy };
        if (accuracy >= 80) strong.push(stat);
        else if (accuracy >= 50) medium.push(stat);
        else weak.push(stat);
      });

      // Sort by accuracy
      weak.sort((a, b) => a.accuracy - b.accuracy);
      strong.sort((a, b) => b.accuracy - a.accuracy);

      const total = latestAttempt.total_questions || topicData.length;
      const correctCount = topicData.filter(a => a.is_correct).length;
      const percentage = total > 0 ? Math.round((correctCount / total) * 100) : (latestAttempt.score || 0);

      setAnalysis({
        testName,
        completedAt: latestAttempt.completed_at || '',
        score: correctCount,
        totalQuestions: total,
        percentage,
        timeTakenSeconds: latestAttempt.time_taken_seconds || 0,
        strongTopics: strong,
        mediumTopics: medium,
        weakTopics: weak,
      });

      // Load saved AI recommendations if any
      const { data: savedPlan } = await supabase
        .from('ai_learning_plans_v2')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (savedPlan?.plan_data) {
        const pd = savedPlan.plan_data as any;
        if (pd?.plan?.actions) {
          setAiRecommendations(pd.plan.actions.map((a: any) => typeof a === 'string' ? a : a?.text || JSON.stringify(a)));
        }
      }

      // Load incorrect answers for mistake review
      const latestTestId = matchedConfig ? `math_test_${matchedConfig[0]}` : '';
      if (latestTestId) {
        const { data: wrongAnswers } = await supabase
          .from('user_answers')
          .select('question_id, topic, test_id')
          .eq('user_id', user.id)
          .eq('test_id', latestTestId)
          .eq('is_correct', false)
          .limit(10);

        if (wrongAnswers) {
          setMistakes(wrongAnswers.map(a => ({
            questionNumber: a.question_id,
            topic: a.topic,
            testId: a.test_id,
          })));
        }
      }
    } catch (e) {
      console.error('Error loading analysis:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateAiPlan = async () => {
    if (!user || !session || !analysis) return;
    setGenerating(true);
    try {
      const diagnosticAnswers = [
        ...analysis.weakTopics.map(t => ({ topic: t.topic, isCorrect: false })),
        ...analysis.mediumTopics.map(t => ({ topic: t.topic, isCorrect: t.accuracy >= 60 })),
        ...analysis.strongTopics.map(t => ({ topic: t.topic, isCorrect: true })),
      ];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-learning-plan-v2`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ diagnosticAnswers, language }),
        }
      );

      if (!response.ok) throw new Error('Failed');
      const planResult = await response.json();

      await supabase.from('ai_learning_plans_v2').update({ is_active: false }).eq('user_id', user.id);
      await supabase.from('ai_learning_plans_v2').insert({
        user_id: user.id,
        plan_data: planResult,
        is_active: true,
      });

      if (planResult?.plan?.actions) {
        setAiRecommendations(planResult.plan.actions.map((a: any) => typeof a === 'string' ? a : a?.text || JSON.stringify(a)));
      }

      toast({ title: "Рекомендации обновлены!" });
    } catch (e) {
      console.error('Error generating plan:', e);
      toast({ title: "Ошибка", description: "Не удалось создать рекомендации", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Мой план</h1>
          <p className="text-muted-foreground mb-6">Войдите, чтобы увидеть план.</p>
          <Button onClick={() => navigate('/login')}>Войти</Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="container py-12 text-center max-w-lg mx-auto">
          <Target className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Нет данных</h1>
          <p className="text-muted-foreground mb-6">Сначала пройдите тест, чтобы система проанализировала ваши знания.</p>
          <Button onClick={() => navigate('/tests')}>
            <Target className="mr-2 h-4 w-4" />
            Перейти к тестам
          </Button>
        </div>
      </Layout>
    );
  }

  const { percentage, score, totalQuestions, timeTakenSeconds, testName, completedAt, strongTopics, weakTopics, mediumTopics } = analysis;

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = () => {
    if (percentage >= 90) return { label: 'Отлично!', variant: 'success' as const };
    if (percentage >= 80) return { label: 'Хорошо', variant: 'success' as const };
    if (percentage >= 60) return { label: 'Удовлетворительно', variant: 'warning' as const };
    return { label: 'Требуется улучшение', variant: 'destructive' as const };
  };

  const scoreBadge = getScoreBadge();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge variant={scoreBadge.variant} className="mb-4 text-lg px-4 py-2">
            <Trophy className="mr-2 h-5 w-5" />
            {scoreBadge.label}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{testName}</h1>
          <p className="text-muted-foreground">
            Завершен {completedAt ? new Date(completedAt).toLocaleDateString('ru-RU') : ''}
          </p>
        </div>

        {/* Score Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card variant="elevated" className="text-center">
            <CardContent className="p-6">
              <div className={`text-5xl font-bold ${getScoreColor()}`}>
                {percentage}%
              </div>
              <p className="text-muted-foreground mt-2">Общий результат</p>
              <Progress value={percentage} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle className="h-6 w-6" />
                    <span className="text-3xl font-bold">{score}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Правильно</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <XCircle className="h-6 w-6" />
                    <span className="text-3xl font-bold">{totalQuestions - score}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Неправильно</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-accent">
                <Clock className="h-6 w-6" />
                <span className="text-3xl font-bold">
                  {Math.floor(timeTakenSeconds / 60)}:{(timeTakenSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-muted-foreground mt-2">Время выполнения</p>
            </CardContent>
          </Card>
        </div>

        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <Card className="mb-6 border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Слабые темы ({weakTopics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{translateTopic(t.topic, language)}</span>
                    <div className="flex items-center gap-3 w-48">
                      <Progress value={t.accuracy} className="h-2 flex-1" />
                      <span className="text-sm font-mono text-destructive w-12 text-right">{t.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medium Topics */}
        {mediumTopics.length > 0 && (
          <Card className="mb-6 border-warning/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-warning" />
                Средние темы ({mediumTopics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mediumTopics.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{translateTopic(t.topic, language)}</span>
                    <div className="flex items-center gap-3 w-48">
                      <Progress value={t.accuracy} className="h-2 flex-1" />
                      <span className="text-sm font-mono text-warning w-12 text-right">{t.accuracy}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strong Topics */}
        {strongTopics.length > 0 && (
          <Card className="mb-6 border-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Сильные темы ({strongTopics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strongTopics.map((t, i) => (
                  <Badge key={i} variant="secondary">
                    {translateTopic(t.topic, language)} — {t.accuracy}%
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Рекомендации AI
              </CardTitle>
              <Button onClick={generateAiPlan} disabled={generating} size="sm" variant="outline">
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Генерация...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" />{aiRecommendations ? 'Обновить' : 'Создать'}</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiRecommendations && aiRecommendations.length > 0 ? (
              <ul className="space-y-2">
                {aiRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Нажмите «Создать» для получения персональных рекомендаций на основе ваших результатов.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Mistake Review */}
        {mistakes.length > 0 && (
          <Card className="mb-6 border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-5 h-5 text-accent" />
                Видеоразбор задач
              </CardTitle>
              <CardDescription>Посмотрите видеоразбор задач, в которых были допущены ошибки</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mistakes.map((m, i) => {
                  const variantMatch = m.testId.match(/math_test_(\d+)/);
                  const variantNum = variantMatch ? variantMatch[1] : '';
                  const variantKey = variantNum ? `variant${variantNum}` : '';
                  const parsed = parseQuestionId(m.questionNumber);
                  const displayNum = parsed ? parsed.questionNumber : m.questionNumber;
                  const displayVariant = parsed ? parsed.variant : (variantNum ? parseInt(variantNum) : null);
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">
                          Задача {displayNum}{displayVariant ? ` — Тест вариант ${displayVariant}` : ''}
                        </span>
                        {m.topic && (
                          <p className="text-xs text-muted-foreground">
                            Тема: {translateTopic(m.topic, language)}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/lessons/video/${variantKey}?question=${displayNum}`}>
                          <Video className="mr-1 h-3 w-3" />
                          Смотреть видеоразбор
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Practice CTA */}
        {weakTopics.length > 0 && (
          <Card className="mb-6 border-accent bg-accent/5">
            <CardContent className="flex items-center justify-between py-5">
              <div>
                <h3 className="font-semibold text-lg">Работа над ошибками</h3>
                <p className="text-sm text-muted-foreground">
                  Практикуйтесь по слабым темам в формате ОРТ — задачи подбираются автоматически
                </p>
              </div>
              <Button variant="accent" size="lg" onClick={() => navigate('/practice')}>
                <Target className="mr-2 h-5 w-5" />
                Начать практику
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/tests')}>
            Все тесты
          </Button>
        </div>
      </div>
    </Layout>
  );
}
