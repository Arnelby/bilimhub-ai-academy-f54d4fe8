import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { saveUserAnswer } from '@/lib/saveUserAnswer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MathQuestion {
  id: number;
  question_number: number;
  topic: string;
  instruction: string | null;
  column_a: string;
  column_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
}

const DURATION_SECONDS = 30 * 60;
const TEST_UUID = '00000000-0000-0000-0000-000000000001';
const TEST_NAME = 'Математика — Диагностический тест (Вариант 2)';

const OPTION_LABELS: { key: string; getLabel: (q: MathQuestion) => string }[] = [
  { key: 'A', getLabel: (q) => `Столбец A больше: ${q.column_a}` },
  { key: 'B', getLabel: (q) => `Столбец B больше: ${q.column_b}` },
  { key: 'C', getLabel: (q) => q.option_c || 'Величины равны' },
  { key: 'D', getLabel: (q) => q.option_d || 'Недостаточно информации' },
];

export default function MathTestTaking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<MathQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(new Date());

  useEffect(() => {
    async function fetchQuestions() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('math_questions')
          .select('*')
          .eq('test_id', 1)
          .order('question_number')
          .order('id');

        if (error) throw error;

        const seen = new Set<number>();
        const unique: MathQuestion[] = [];
        for (const q of (data || [])) {
          if (!seen.has(q.question_number)) {
            seen.add(q.question_number);
            unique.push(q);
          }
        }
        setQuestions(unique);
      } catch (err) {
        console.error('Error loading questions:', err);
        toast({ title: 'Ошибка', description: 'Не удалось загрузить вопросы', variant: 'destructive' });
        navigate('/tests');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [user, navigate, toast]);

  useEffect(() => {
    if (timeLeft <= 0 || loading || isPaused) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, isPaused]);

  const handleAnswerSelect = (option: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.question_number]: option }));

    if (user) {
      const optionMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      saveUserAnswer({
        userId: user.id,
        testId: 'math_test_1',
        testName: TEST_NAME,
        questionId: `mq_${q.question_number}`,
        topic: q.topic,
        selectedOption: optionMap[option] ?? 0,
        correctOption: optionMap[q.correct_answer] ?? 0,
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      let correct = 0;
      const questionAttempts: { question_id: string; topic: string; is_correct: boolean }[] = [];

      for (const q of questions) {
        const userAnswer = answers[q.question_number];
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) correct++;
        questionAttempts.push({
          question_id: `mq_${q.question_number}`,
          topic: q.topic,
          is_correct: isCorrect,
        });
      }

      const total = questions.length;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

      const { data: attemptData, error: attemptError } = await supabase
        .from('user_tests')
        .insert({
          user_id: user.id,
          test_id: TEST_UUID,
          score: percentage,
          total_questions: total,
          time_taken_seconds: timeTaken,
          completed_at: new Date().toISOString(),
          answers: Object.entries(answers).map(([qNum, ans]) => ({
            questionNumber: parseInt(qNum),
            answer: ans,
          })),
          ai_analysis: {
            correct_count: correct,
            total: total,
            percentage,
          },
        })
        .select('id')
        .single();

      if (attemptError) throw attemptError;

      if (attemptData?.id) {
        const attemptsToInsert = questionAttempts.map(qa => ({
          user_id: user.id,
          test_attempt_id: attemptData.id,
          question_id: qa.question_id,
          topic: qa.topic,
          is_correct: qa.is_correct,
          time_spent_seconds: 0,
        }));
        await supabase.from('question_attempts').insert(attemptsToInsert);
      }

      navigate(`/tests/${TEST_UUID}/results/${attemptData?.id}`);
    } catch (err) {
      console.error('Error submitting:', err);
      toast({ title: 'Ошибка', description: 'Не удалось сохранить результаты', variant: 'destructive' });
      setSubmitting(false);
    }
  }, [user, submitting, answers, questions, startTime, navigate, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];
  const isTimeWarning = timeLeft < 300;
  const isLastQuestion = currentIndex === questions.length - 1;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Вопросы не найдены</p>
        <Button onClick={() => navigate('/tests')}>Назад</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setShowFinishDialog(true)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Выйти
            </Button>
            <h1 className="hidden sm:block font-semibold text-sm">{TEST_NAME}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isPaused ? 'accent' : 'outline'}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="gap-1"
            >
              {isPaused ? <><Play className="h-4 w-4" />Продолжить</> : <><Pause className="h-4 w-4" />Пауза</>}
            </Button>
            <Badge variant={isTimeWarning ? 'destructive' : isPaused ? 'outline' : 'secondary'} className={`text-lg px-3 py-1 ${isPaused ? 'animate-pulse' : ''}`}>
              <Clock className="mr-2 h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="outline">
              {answeredCount}/{questions.length}
            </Badge>
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-1" />
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {isPaused ? (
            <Card className="mb-6 bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Pause className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Тест на паузе</h2>
                <Button variant="accent" size="lg" onClick={() => setIsPaused(false)}>
                  <Play className="mr-2 h-5 w-5" />
                  Продолжить тест
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* SAT-style question card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Badge variant="accent">Вопрос {currentIndex + 1} из {questions.length}</Badge>
                    <Badge variant="outline">{currentQuestion?.topic}</Badge>
                  </div>

                  {/* Instruction */}
                  {currentQuestion?.instruction ? (
                    <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
                      <p className="text-base font-medium whitespace-pre-line">{currentQuestion.instruction}</p>
                    </div>
                  ) : (
                    <p className="mb-5 text-base text-muted-foreground">
                      Сравните величины в столбцах A и B. Выберите правильный ответ.
                    </p>
                  )}

                  {/* Columns A and B side by side */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец A</p>
                      <p className="text-xl font-bold">{currentQuestion?.column_a}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец B</p>
                      <p className="text-xl font-bold">{currentQuestion?.column_b}</p>
                    </div>
                  </div>

                  {/* Answer options */}
                  <div className="space-y-3">
                    {currentQuestion && OPTION_LABELS.map(opt => {
                      const isSelected = answers[currentQuestion.question_number] === opt.key;
                      let displayText = '';
                      if (opt.key === 'A') displayText = 'Величина в столбце A больше';
                      else if (opt.key === 'B') displayText = 'Величина в столбце B больше';
                      else if (opt.key === 'C') displayText = currentQuestion.option_c || 'Величины равны';
                      else displayText = currentQuestion.option_d || 'Недостаточно информации';

                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleAnswerSelect(opt.key)}
                          className={`w-full rounded-lg border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-accent bg-accent/10 ring-2 ring-accent'
                              : 'border-border hover:border-accent/50 hover:bg-muted/50'
                          }`}
                        >
                          <span className={`mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${
                            isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
                          }`}>
                            {opt.key}
                          </span>
                          {displayText}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Назад
                </Button>

                <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
                  {questions.map((q, index) => (
                    <button
                      key={q.question_number}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                        index === currentIndex
                          ? 'bg-accent text-accent-foreground'
                          : answers[q.question_number] !== undefined
                          ? 'bg-accent/20 text-accent'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {isLastQuestion ? (
                  <Button variant="accent" onClick={() => setShowFinishDialog(true)} disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Завершить
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                  >
                    Далее
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Завершить тест?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы ответили на {answeredCount} из {questions.length} вопросов.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-warning">
                  Неотвеченные вопросы будут засчитаны как неправильные.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продолжить тест</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Завершить и показать результаты
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
