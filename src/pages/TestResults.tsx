import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Trophy,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { useGamificationEvents } from '@/hooks/useGamificationEvents';
import { Confetti } from '@/components/gamification/Confetti';
import { TEST_CONFIG } from '@/lib/mathTestConfig';
import { parseScore } from '@/lib/scoreUtils';
import { QuestionReview, QuestionReviewData } from '@/components/review/QuestionReview';

interface AnswerDetail {
  questionNumber: number;
  dbQuestionNumber?: number;
  answer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  topic: string;
  type: 'comparison' | 'mcq';
  instruction?: string;
  column_a?: string;
  column_b?: string;
  options?: Record<string, string>;
}

interface TestResult {
  id: string;
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  ai_analysis: any;
  answers: AnswerDetail[] | any[];
  completed_at: string;
  test: {
    title: string;
    title_ru: string | null;
  };
}

export default function TestResults() {
  const { testId, attemptId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isAI } = useUserGroup();
  const { triggerEvent } = useGamificationEvents();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [explanationsByQNum, setExplanationsByQNum] = useState<
    Record<number, {
      correct_explanation: string | null;
      explanation_a: string | null;
      explanation_b: string | null;
      explanation_c: string | null;
      explanation_d: string | null;
      explanation_e: string | null;
    }>
  >({});

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

        // Load DB explanations for all questions of this test (data-driven, no AI)
        const numericTestId = Object.entries(TEST_CONFIG).find(
          ([, cfg]) => cfg.uuid === (data as any).test_id,
        )?.[0];
        if (numericTestId) {
          const cfg = TEST_CONFIG[Number(numericTestId)];
          const table = cfg.table;
          const { data: expls } = await supabase
            .from(table)
            .select(
              'question_number, correct_explanation, explanation_a, explanation_b, explanation_c, explanation_d' +
                (table === 'math_test_questions' ? ', explanation_e' : ''),
            )
            .eq('test_id', Number(numericTestId));
          if (expls) {
            const map: Record<number, any> = {};
            for (const row of expls as any[]) {
              // For variant 2/4 (mtq) DB stores 31..60 / 91..120 etc → display number = ((qn-1)%30)+1
              const displayNum =
                table === 'math_test_questions'
                  ? ((row.question_number - 1) % 30) + 1
                  : row.question_number;
              map[displayNum] = {
                correct_explanation: row.correct_explanation ?? null,
                explanation_a: row.explanation_a ?? null,
                explanation_b: row.explanation_b ?? null,
                explanation_c: row.explanation_c ?? null,
                explanation_d: row.explanation_d ?? null,
                explanation_e: (row as any).explanation_e ?? null,
              };
            }
            setExplanationsByQNum(map);
          }
        }

        const gamParsed = parseScore(data.score, data.total_questions);
        const percentage = gamParsed.percentage;

        const pointsEarned = Math.round(percentage / 2) + 25;

        setTimeout(() => {
          triggerEvent({
            type: 'test_completed',
            value: pointsEarned,
            description: t('testResultsPage.completedDescription', { percent: percentage }),
          });
        }, 500);

        if (percentage === 100) {
          setTimeout(() => {
            triggerEvent({
              type: 'perfect_score',
              title: t('testResultsPage.perfect.title'),
              description: t('testResultsPage.perfect.description'),
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
          <h1 className="text-2xl font-bold">{t('testResultsPage.notFound')}</h1>
          <Button asChild className="mt-4">
            <Link to="/tests">{t('testResultsPage.backToTests')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const parsed = parseScore(result.score, result.total_questions);
  const score = parsed.correct;
  const total = parsed.total;
  const percentage = parsed.percentage;
  const timeTaken = result.time_taken_seconds || 0;
  const analysis = result.ai_analysis;

  // Parse answers - support both rich format and legacy format
  const answerDetails: AnswerDetail[] = (result.answers || []).map((a: any) => {
    if (a.correctAnswer !== undefined) {
      // Rich format from updated MathTestTaking
      return a as AnswerDetail;
    }
    // Legacy format: {questionNumber, answer}
    return {
      questionNumber: a.questionNumber || a.question_number || 0,
      answer: a.answer || null,
      correctAnswer: '',
      isCorrect: false,
      topic: '',
      type: 'comparison' as const,
    };
  });

  const hasRichAnswers = answerDetails.length > 0 && answerDetails[0]?.correctAnswer;

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
  const displayedAnswers = showAllQuestions ? answerDetails : answerDetails.slice(0, 10);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {showConfetti && <Confetti />}
        
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
                {score}/{total}
              </div>
              <p className="text-lg font-semibold mt-1">{percentage}%</p>
              <p className="text-muted-foreground mt-1">Общий результат</p>
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

        {/* Per-Question Breakdown — collapsed by default for less overload */}
        {hasRichAnswers && answerDetails.length > 0 && (
          <Card className="mb-8">
            <Collapsible>
              <CollapsibleTrigger className="w-full text-left group">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Разбор по вопросам ({answerDetails.length})</CardTitle>
                    <CardDescription>Нажмите, чтобы посмотреть подробный разбор</CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-3">
                    {displayedAnswers.map((a, idx) => {
                      const expl = explanationsByQNum[a.questionNumber] || {
                        correct_explanation: null,
                        explanation_a: null,
                        explanation_b: null,
                        explanation_c: null,
                        explanation_d: null,
                        explanation_e: null,
                      };
                      const numericTestId = Object.entries(TEST_CONFIG).find(
                        ([, cfg]) => cfg.uuid === (result as any).test_id,
                      )?.[0];
                      const cfg = numericTestId ? TEST_CONFIG[Number(numericTestId)] : null;
                      const cachePrefix = cfg?.table === 'math_test_questions' ? 'mtq' : 'mq';
                      const cacheId = numericTestId
                        ? `${cachePrefix}_${numericTestId}_${a.questionNumber}`
                        : null;
                      const reviewData: QuestionReviewData = {
                        questionNumber: a.questionNumber,
                        topic: a.topic,
                        type: a.type,
                        instruction: a.instruction,
                        column_a: a.column_a,
                        column_b: a.column_b,
                        options: a.options,
                        userAnswer: a.answer,
                        correctAnswer: a.correctAnswer,
                        isCorrect: a.isCorrect,
                        correctExplanation: expl.correct_explanation,
                        explanationA: expl.explanation_a,
                        explanationB: expl.explanation_b,
                        explanationC: expl.explanation_c,
                        explanationD: expl.explanation_d,
                        explanationE: expl.explanation_e,
                        questionCacheId: cacheId,
                      };
                      return (
                        <QuestionReview
                          key={idx}
                          data={reviewData}
                          groupMode={isAI ? 'ai' : 'control'}
                        />
                      );
                    })}
                  </div>

                  {answerDetails.length > 10 && !showAllQuestions && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setShowAllQuestions(true)}
                    >
                      Показать все {answerDetails.length} вопросов
                    </Button>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/tests">
              Все тесты
            </Link>
          </Button>
          {isAI && (
            <Button variant="outline" asChild>
              <Link to="/learning-plan">
                Мой план
              </Link>
            </Button>
          )}
          <Button variant="accent" asChild>
            <Link to="/lessons">
              Уроки
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
