import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { saveUserAnswer } from '@/lib/saveUserAnswer';
import { MathRenderer } from '@/components/math/MathRenderer';
import { QuestionImage } from '@/components/math/QuestionImage';
import { TEST_CONFIG, toCyrillicKey, toLatinKey } from '@/lib/mathTestConfig';
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

interface ComparisonQuestion {
  type: 'comparison';
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

interface McqQuestion {
  type: 'mcq';
  id: number;
  question_number: number;
  topic: string;
  instruction: string;
  options: Record<string, string>;
  correct_answer: string;
}

type TestQuestion = ComparisonQuestion | McqQuestion;

export default function MathTestTaking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { testId: testIdParam } = useParams<{ testId: string }>();

  const mathTestId = parseInt(testIdParam || '1', 10);
  const config = TEST_CONFIG[mathTestId] || TEST_CONFIG[1];

  // Variant 2 stores question_numbers 31-60 in DB but should display as 1-30
  const getDisplayNumber = (dbQuestionNumber: number) => {
    if (mathTestId === 2 && dbQuestionNumber >= 31) {
      return dbQuestionNumber - 30;
    }
    return dbQuestionNumber;
  };

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // answers stored with LATIN keys internally (A,B,C,D,E)
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(config.durationSeconds);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(new Date());
  // Per-question time tracking
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});

  useEffect(() => {
    async function fetchQuestions() {
      if (!user) return;
      try {
        if (config.table === 'math_test_questions') {
          const { data, error } = await supabase
            .from('math_test_questions')
            .select('*')
            .eq('test_id', mathTestId)
            .order('question_number')
            .order('id')
            .limit(30);
          if (error) throw error;
          const seen = new Set<number>();
          const unique: TestQuestion[] = [];
          for (const q of (data || [])) {
            if (!seen.has(q.question_number)) {
              seen.add(q.question_number);
              const rawOptions = (q.options as Record<string, string>) || {};
              const hasOptions = Object.keys(rawOptions).length > 0;
              
              if (hasOptions) {
                // MCQ with explicit options
                const normalizedOptions: Record<string, string> = {};
                for (const [k, v] of Object.entries(rawOptions)) {
                  normalizedOptions[toLatinKey(k)] = v;
                }
                unique.push({
                  type: 'mcq',
                  id: q.id,
                  question_number: q.question_number,
                  topic: q.topic || '',
                  instruction: q.instruction || '',
                  options: normalizedOptions,
                  correct_answer: toLatinKey(q.correct_answer),
                });
              } else {
                // Comparison-style question stored in math_test_questions
                unique.push({
                  type: 'comparison',
                  id: q.id,
                  question_number: q.question_number,
                  topic: q.topic || '',
                  instruction: q.instruction,
                  column_a: q.column_a || '',
                  column_b: q.column_b || '',
                  option_c: null,
                  option_d: null,
                  correct_answer: toLatinKey(q.correct_answer),
                });
              }
            }
          }
          setQuestions(unique);
        } else {
          const { data, error } = await supabase
            .from('math_questions')
            .select('*')
            .eq('test_id', mathTestId)
            .order('question_number')
            .order('id')
            .limit(30);
          if (error) throw error;
          const seen = new Set<number>();
          const unique: TestQuestion[] = [];
          for (const q of (data || [])) {
            if (!seen.has(q.question_number)) {
              seen.add(q.question_number);
              unique.push({
                type: 'comparison',
                id: q.id,
                question_number: q.question_number,
                topic: q.topic,
                instruction: q.instruction,
                column_a: q.column_a,
                column_b: q.column_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: toLatinKey(q.correct_answer),
              });
            }
          }
          setQuestions(unique);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        toast({ title: 'Ошибка', description: 'Не удалось загрузить вопросы', variant: 'destructive' });
        navigate('/tests');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [user, mathTestId, navigate, toast, config.table]);

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

  // Track time when changing questions
  const recordQuestionTime = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.round((now - questionStartTime) / 1000);
    const q = questions[currentIndex];
    if (q) {
      setQuestionTimes(prev => ({
        ...prev,
        [q.question_number]: (prev[q.question_number] || 0) + elapsed,
      }));
    }
    setQuestionStartTime(now);
  }, [currentIndex, questionStartTime, questions]);

  const navigateToQuestion = useCallback((newIndex: number) => {
    recordQuestionTime();
    setCurrentIndex(newIndex);
  }, [recordQuestionTime]);

  // option is always Latin (A-E)
  const handleAnswerSelect = (latinKey: string) => {
    const q = questions[currentIndex];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.question_number]: latinKey }));

    if (user) {
      const optionKeys = q.type === 'mcq' ? Object.keys(q.options) : ['A', 'B', 'C', 'D'];
      const selectedIdx = optionKeys.indexOf(latinKey);
      const correctIdx = optionKeys.indexOf(q.correct_answer);
      const displayNum = getDisplayNumber(q.question_number);
      saveUserAnswer({
        userId: user.id,
        testId: `math_test_${mathTestId}`,
        testName: config.name,
        questionId: `mq_${mathTestId}_${displayNum}`,
        topic: q.topic,
        selectedOption: selectedIdx >= 0 ? selectedIdx : 0,
        correctOption: correctIdx >= 0 ? correctIdx : 0,
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      // Record time for current question before submitting
      recordQuestionTime();
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      let correct = 0;
      const questionAttempts: { question_id: string; topic: string; is_correct: boolean }[] = [];

      for (const q of questions) {
        const userAnswer = answers[q.question_number];
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) correct++;
        const displayNum = getDisplayNumber(q.question_number);
        questionAttempts.push({
          question_id: `mq_${mathTestId}_${displayNum}`,
          topic: q.topic,
          is_correct: isCorrect,
        });
      }

      const total = questions.length;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Calculate attempt number
      const { count: prevAttempts } = await supabase
        .from('user_tests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const attemptNumber = (prevAttempts || 0) + 1;
      const testType = attemptNumber === 1 ? 'pre' : 'post';

      const { data: attemptData, error: attemptError } = await supabase
        .from('user_tests')
        .insert({
          user_id: user.id,
          test_id: config.uuid,
          score: correct,
          total_questions: total,
          time_taken_seconds: timeTaken,
          completed_at: new Date().toISOString(),
          attempt_number: attemptNumber,
          test_type: testType,
          answers: Object.entries(answers).map(([qNum, ans]) => ({
            questionNumber: parseInt(qNum),
            answer: ans,
          })),
          ai_analysis: {
            correct_count: correct,
            total,
            percentage,
            math_test_id: mathTestId,
          },
        } as any)
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
          time_spent_seconds: questionTimes[questions.find(q => `mq_${mathTestId}_${getDisplayNumber(q.question_number)}` === qa.question_id)?.question_number || 0] || 0,
        }));
        await supabase.from('question_attempts').insert(attemptsToInsert);
      }

      // Mark diagnostic as completed if this is the user's first test
      const { data: existingProfile } = await supabase
        .from('user_diagnostic_profile')
        .select('diagnostic_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingProfile?.diagnostic_completed) {
        await supabase
          .from('user_diagnostic_profile')
          .upsert({
            user_id: user.id,
            diagnostic_completed: true,
            completed_at: new Date().toISOString(),
            math_level: Math.min(5, Math.max(1, Math.ceil((percentage / 100) * 5))),
            accuracy_score: percentage,
            target_ort_score: 170,
            months_until_exam: 6,
          }, { onConflict: 'user_id' });
      }

      navigate('/learning-plan');
    } catch (err) {
      console.error('Error submitting:', err);
      toast({ title: 'Ошибка', description: 'Не удалось сохранить результаты', variant: 'destructive' });
      setSubmitting(false);
    }
  }, [user, submitting, answers, questions, startTime, navigate, toast, config, mathTestId]);

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

  const renderComparisonQuestion = (q: ComparisonQuestion) => (
    <>
      {q.instruction ? (
        <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
          <MathRenderer content={q.instruction} />
        </div>
      ) : (
        <p className="mb-5 text-base text-muted-foreground">
          Сравните величины в столбцах A и B. Выберите правильный ответ.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец A</p>
          <MathRenderer content={q.column_a} className="text-xl font-bold" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Столбец B</p>
          <MathRenderer content={q.column_b} className="text-xl font-bold" />
        </div>
      </div>

      <div className="space-y-3">
        {[
          { key: 'A', label: 'Величина в столбце A больше' },
          { key: 'B', label: 'Величина в столбце B больше' },
          { key: 'C', label: q.option_c || 'Величины равны' },
          { key: 'D', label: q.option_d || 'Недостаточно информации' },
        ].map(opt => renderOptionButton(opt.key, opt.label, q.question_number))}
      </div>
    </>
  );

  const renderMcqQuestion = (q: McqQuestion) => (
    <>
      <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">Условие:</p>
        <MathRenderer content={q.instruction} />
      </div>

      <div className="space-y-3">
        {Object.entries(q.options).map(([key, value]) =>
          renderOptionButton(key, value, q.question_number)
        )}
      </div>
    </>
  );

  // key is always Latin; display as Cyrillic
  const renderOptionButton = (key: string, label: string, questionNumber: number) => {
    const isSelected = answers[questionNumber] === key;
    const displayKey = toCyrillicKey(key);
    return (
      <button
        key={key}
        onClick={() => handleAnswerSelect(key)}
        className={`w-full rounded-lg border p-3 sm:p-4 text-left transition-all min-h-[48px] text-sm sm:text-base ${
          isSelected
            ? 'border-accent bg-accent/10 ring-2 ring-accent'
            : 'border-border hover:border-accent/50 hover:bg-muted/50'
        }`}
      >
        <span className={`mr-2 sm:mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold shrink-0 ${
          isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
        }`}>
          {displayKey}
        </span>
        <MathRenderer content={label} inline />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => setShowFinishDialog(true)} className="shrink-0 min-h-[44px] min-w-[44px] px-2 sm:px-3">
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
            <h1 className="hidden sm:block font-semibold text-sm truncate">{config.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant={isPaused ? 'accent' : 'outline'}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              className="gap-1 min-h-[44px] px-2 sm:px-3"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="hidden sm:inline">{isPaused ? 'Продолжить' : 'Пауза'}</span>
            </Button>
            <Badge variant={isTimeWarning ? 'destructive' : isPaused ? 'outline' : 'secondary'} className={`text-base sm:text-lg px-2 sm:px-3 py-1 ${isPaused ? 'animate-pulse' : ''}`}>
              <Clock className="mr-1 sm:mr-2 h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="outline" className="text-sm px-1.5 sm:px-2">
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
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Badge variant="accent">Вопрос {currentIndex + 1} из {questions.length}</Badge>
                    <Badge variant="outline">{currentQuestion?.topic}</Badge>
                  </div>

                  {currentQuestion && (
                    <QuestionImage
                      variantId={mathTestId}
                      questionNumber={getDisplayNumber(currentQuestion.question_number)}
                    />
                  )}

                  {currentQuestion?.type === 'mcq'
                    ? renderMcqQuestion(currentQuestion)
                    : currentQuestion?.type === 'comparison'
                    ? renderComparisonQuestion(currentQuestion)
                    : null}
                </CardContent>
              </Card>

              {/* Question number grid */}
              <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 min-w-0">
                  {questions.map((q, index) => (
                    <button
                      key={q.question_number}
                      onClick={() => navigateToQuestion(index)}
                      className={`h-9 w-9 sm:h-8 sm:w-8 rounded text-xs font-medium transition-colors shrink-0 ${
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
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigateToQuestion(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="min-h-[44px] px-3 sm:px-4"
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Назад</span>
                </Button>

                {isLastQuestion ? (
                  <Button variant="accent" onClick={() => setShowFinishDialog(true)} disabled={submitting} className="min-h-[44px]">
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Завершить
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => navigateToQuestion(currentIndex + 1)}
                    className="min-h-[44px] px-3 sm:px-4"
                  >
                    <span className="hidden sm:inline">Далее</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </main>

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
