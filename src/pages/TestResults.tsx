import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Loader2,
  Target,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamificationEvents } from '@/hooks/useGamificationEvents';
import { Confetti } from '@/components/gamification/Confetti';

interface TestResult {
  id: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  ai_analysis: {
    assessment: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    motivation: string;
  };
  answers: number[];
  completed_at: string;
  test: {
    title: string;
    title_ru: string | null;
  };
}

export default function TestResults() {
  const { testId, attemptId } = useParams();
  const { user } = useAuth();
  const { triggerEvent, triggerConfetti } = useGamificationEvents();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!attemptId || !user) return;

      try {
        const { data, error } = await supabase
          .from('user_tests')
          .select(`
            *,
            test:tests(title, title_ru)
          `)
          .eq('id', attemptId)
          .single();

        if (error) throw error;
        setResult(data as unknown as TestResult);

        // Trigger gamification events
        const rawGamScore = data.score || 0;
        const total = data.total_questions || 1;
        const safeGamScore = rawGamScore > total ? Math.round((rawGamScore / 100) * total) : rawGamScore;
        const percentage = Math.max(0, Math.min(100, Math.round((safeGamScore / total) * 100)));
        
        // Award points based on score
        const pointsEarned = Math.round(percentage / 2) + 25;
        
        setTimeout(() => {
          triggerEvent({
            type: 'test_completed',
            value: pointsEarned,
            description: `${percentage}% правильно`,
          });
        }, 500);

        // Perfect score celebration
        if (percentage === 100) {
          setTimeout(() => {
            triggerEvent({
              type: 'perfect_score',
              title: 'Идеальный результат!',
              description: 'Вы ответили на все вопросы правильно!',
            });
            setShowConfetti(true);
          }, 1500);
        } else if (percentage >= 80) {
          setShowConfetti(true);
        }

      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [attemptId, user, triggerEvent]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!result) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Результаты не найдены</h1>
          <Button asChild className="mt-4">
            <Link to="/tests">Вернуться к тестам</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const rawScore = result.score || 0;
  const total = result.total_questions || 1;
  // If score > total, it's likely already a percentage — use as-is but clamp
  const score = rawScore > total ? Math.round((rawScore / 100) * total) : rawScore;
  const percentage = Math.max(0, Math.min(100, Math.round((score / total) * 100)));
  const timeTaken = result.time_taken_seconds || 0;
  const analysis = result.ai_analysis;

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge variant={scoreBadge.variant} className="mb-4 text-lg px-4 py-2">
            <Trophy className="mr-2 h-5 w-5" />
            {scoreBadge.label}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">
            {result.test?.title_ru || result.test?.title}
          </h1>
          <p className="text-muted-foreground">
            Завершен {new Date(result.completed_at).toLocaleDateString('ru-RU')}
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
                    <span className="text-3xl font-bold">{total - score}</span>
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
                  {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-muted-foreground mt-2">Время выполнения</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        {analysis && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assessment */}
            <Card variant="accent" className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Анализ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{analysis.assessment}</p>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <TrendingUp className="h-5 w-5" />
                  Сильные стороны
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths?.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-1 text-success shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <TrendingDown className="h-5 w-5" />
                  Области для улучшения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses?.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="h-4 w-4 mt-1 text-warning shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Рекомендации</CardTitle>
                <CardDescription>Персональный план улучшения от AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {analysis.recommendations?.map((rec, index) => (
                    <div key={index} className="rounded-lg border border-border p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent font-bold mb-3">
                        {index + 1}
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Motivation */}
            <Card className="lg:col-span-2 bg-gradient-to-r from-accent/10 to-success/10 border-accent/20">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-medium">{analysis.motivation}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/tests">
              Все тесты
            </Link>
          </Button>
          <Button variant="accent" asChild>
            <Link to="/lessons">
              Изучить рекомендованные темы
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
