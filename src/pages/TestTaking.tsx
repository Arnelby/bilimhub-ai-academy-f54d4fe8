import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Flag, Loader2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { updateGamification } from '@/hooks/useGamification';
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

interface Question {
  id: string;
  question_text: string;
  question_text_ru: string | null;
  options: string[];
  correct_option: number;
  explanation: string | null;
  order_index: number;
  image_url: string | null;
}

interface Test {
  id: string;
  title: string;
  title_ru: string | null;
  duration_minutes: number;
  type: string;
}

export default function TestTaking() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [testAttemptId, setTestAttemptId] = useState<string | null>(null);
  const [startTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);

  // Fetch test and questions
  useEffect(() => {
    async function fetchTest() {
      if (!testId || !user) return;

      try {
        // Fetch test details
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (testError) throw testError;
        setTest(testData);
        setTimeLeft(testData.duration_minutes * 60);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', testId)
          .order('order_index');

        if (questionsError) throw questionsError;
        
        const formattedQuestions = questionsData.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
        }));
        
        setQuestions(formattedQuestions);
        setAnswers(new Array(formattedQuestions.length).fill(null));

        // Create test attempt
        const { data: attemptData, error: attemptError } = await supabase
          .from('user_tests')
          .insert({
            user_id: user.id,
            test_id: testId,
            total_questions: formattedQuestions.length,
          })
          .select()
          .single();

        if (attemptError) throw attemptError;
        setTestAttemptId(attemptData.id);

      } catch (error) {
        console.error('Error fetching test:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить тест',
          variant: 'destructive',
        });
        navigate('/tests');
      } finally {
        setLoading(false);
      }
    }

    fetchTest();
  }, [testId, user, navigate, toast]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || loading || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, isPaused]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Auto-save answers
  useEffect(() => {
    if (!testAttemptId || answers.every(a => a === null)) return;

    const saveAnswers = async () => {
      await supabase
        .from('user_tests')
        .update({ answers })
        .eq('id', testAttemptId);
    };

    const debounce = setTimeout(saveAnswers, 1000);
    return () => clearTimeout(debounce);
  }, [answers, testAttemptId]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (!testAttemptId || !user || submitting) return;
    setSubmitting(true);

    try {
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      // Call AI analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('ai-analyze-test', {
        body: {
          testAttemptId,
          answers,
          questions,
        },
      });

      if (analysisError) throw analysisError;

      // Update test attempt with results
      await supabase
        .from('user_tests')
        .update({
          answers,
          score: analysisData.score,
          time_taken_seconds: timeTaken,
          completed_at: new Date().toISOString(),
          ai_analysis: analysisData.analysis,
        })
        .eq('id', testAttemptId);

      // Update gamification (points, streak, achievements)
      const pointsEarned = Math.round(analysisData.score * 0.5) + 25; // Base 25 points + score bonus
      await updateGamification({
        userId: user.id,
        pointsEarned,
        testScore: analysisData.score,
      });

      // Navigate to results
      navigate(`/tests/${testId}/results/${testAttemptId}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить результаты',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  }, [testAttemptId, user, submitting, answers, questions, startTime, navigate, testId, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const currentQuestion = questions[currentIndex];
  const isTimeWarning = timeLeft < 300; // Less than 5 minutes

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setShowExitDialog(true)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Выйти
            </Button>
            <h1 className="font-semibold">{test?.title_ru || test?.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isPaused ? 'accent' : 'outline'}
              size="sm"
              onClick={togglePause}
              className="gap-1"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Продолжить
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Пауза
                </>
              )}
            </Button>
            <Badge variant={isTimeWarning ? 'destructive' : isPaused ? 'outline' : 'secondary'} className={`text-lg px-3 py-1 ${isPaused ? 'animate-pulse' : ''}`}>
              <Clock className="mr-2 h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="ghost">
              {answeredCount}/{questions.length}
            </Badge>
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-1" />
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Pause Overlay */}
          {isPaused && (
            <Card className="mb-6 bg-muted/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Pause className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Тест на паузе</h2>
                <p className="text-muted-foreground mb-6 text-center">
                  Таймер остановлен. Нажмите «Продолжить» чтобы вернуться к тесту.
                </p>
                <Button variant="accent" size="lg" onClick={togglePause}>
                  <Play className="mr-2 h-5 w-5" />
                  Продолжить тест
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Question */}
          {!isPaused && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="accent">Вопрос {currentIndex + 1}</Badge>
                <Button variant="ghost" size="sm">
                  <Flag className="mr-1 h-4 w-4" />
                  Отметить
                </Button>
              </div>

              {/* Question Image */}
              {currentQuestion?.image_url && (
                <div className="mb-6 flex justify-center">
                  <img 
                    src={currentQuestion.image_url} 
                    alt={`Вопрос ${currentIndex + 1}`}
                    className="max-w-full rounded-lg border border-border"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Question Text (shown if no image or as fallback) */}
              {(!currentQuestion?.image_url || currentQuestion?.question_text) && (
                <p className="mb-6 text-lg font-medium whitespace-pre-line">
                  {currentQuestion?.question_text_ru || currentQuestion?.question_text}
                </p>
              )}

              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      answers[currentIndex] === index
                        ? 'border-accent bg-accent/10 ring-2 ring-accent'
                        : 'border-border hover:border-accent/50 hover:bg-muted/50'
                    }`}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Navigation */}
          {!isPaused && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>

            <div className="flex flex-wrap justify-center gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                    index === currentIndex
                      ? 'bg-accent text-accent-foreground'
                      : answers[index] !== null
                      ? 'bg-success/20 text-success'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentIndex === questions.length - 1 ? (
              <Button variant="accent" onClick={() => setShowExitDialog(true)} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Завершить
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              >
                Далее
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          )}
        </div>
      </main>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
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
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Завершить и показать результаты
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
