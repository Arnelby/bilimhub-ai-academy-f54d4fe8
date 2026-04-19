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
  // Per-question time tracking
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});

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

        // Calculate attempt number and test type
        const { count: prevAttempts } = await supabase
          .from('user_tests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const attemptNumber = (prevAttempts || 0) + 1;
        const testType = attemptNumber === 1 ? 'pre' : 'post';

        // Resolve participant_id for initial insert
        const { getParticipantInfo } = await import('@/lib/getParticipantInfo');
        const { participantId: pid, groupType: gt } = await getParticipantInfo(user.id);

        // Create test attempt (started_at = now() via DB default)
        const { data: attemptData, error: attemptError } = await supabase
          .from('user_tests')
          .insert({
            user_id: user.id,
            test_id: testId,
            total_questions: formattedQuestions.length,
            attempt_number: attemptNumber,
            test_type: testType,
            participant_id: pid,
            group_type: gt,
            data_version: 'v2',
            is_reliable: !!pid,
          } as any)
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

  // Track time when changing questions
  const recordQuestionTime = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.round((now - questionStartTime) / 1000);
    setQuestionTimes(prev => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + elapsed,
    }));
    setQuestionStartTime(now);
  }, [currentIndex, questionStartTime]);

  const navigateToQuestion = useCallback((newIndex: number) => {
    recordQuestionTime();
    setCurrentIndex(newIndex);
  }, [recordQuestionTime]);

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    // Save answer to user_answers table
    if (user && currentQuestion && test) {
      saveUserAnswer({
        userId: user.id,
        testId: testId || test.id,
        testName: test.title_ru || test.title,
        questionId: currentQuestion.id,
        topic: undefined,
        selectedOption: optionIndex,
        correctOption: currentQuestion.correct_option,
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!testAttemptId || !user || submitting) return;
    setSubmitting(true);

    try {
      recordQuestionTime();
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      // Resolve participant_id
      const { getParticipantInfo } = await import('@/lib/getParticipantInfo');
      const { participantId, groupType } = await getParticipantInfo(user.id);

      // Deterministic scoring — no AI call. Just count correct answers.
      const totalQ = questions.length;
      const safeScore = questions.reduce(
        (acc, q, idx) => (answers[idx] === q.correct_option ? acc + 1 : acc),
        0,
      );

      // Update test attempt with results
      await supabase
        .from('user_tests')
        .update({
          answers,
          score: safeScore,
          total_questions: totalQ,
          time_taken_seconds: timeTaken,
          completed_at: new Date().toISOString(),
          // ai_analysis is intentionally NOT set — analysis is now derived
          // deterministically at view time in TestResults / LearningPlan.
          participant_id: participantId,
          group_type: groupType,
          data_version: 'v2',
          is_reliable: !!participantId,
        } as any)
        .eq('id', testAttemptId);

      // Save per-question attempts for research tracking
      // answers[] stores 0-based option index; convert to Latin letter for research
      const indexToLetter = (idx: number | null | undefined): string | null => {
        if (idx === null || idx === undefined) return null;
        const letters = ['A', 'B', 'C', 'D', 'E'];
        return letters[idx] || null;
      };
      const questionAttemptsToInsert = questions.map((q, idx) => {
        const rawAnswer = answers[idx];
        const userAnswerLetter = indexToLetter(rawAnswer);
        const correctAnswerLetter = indexToLetter(q.correct_option);
        
        console.log("[ANSWER DEBUG]", {
          question_id: q.id,
          raw_ui_answer: rawAnswer,
          final_user_answer: userAnswerLetter,
          correct_answer: correctAnswerLetter,
        });
        
        // Validate: user_answer should never be "0"
        if (userAnswerLetter === '0') {
          console.warn("INVALID USER_ANSWER DETECTED", { question_id: q.id, user_answer: userAnswerLetter });
        }
        
        const qaReliable = !!(participantId && userAnswerLetter);
        if (!qaReliable) {
          console.warn('[DATA_INTEGRITY] Unreliable question_attempt:', { question_id: q.id, participantId, userAnswerLetter });
        }
        
        return {
          user_id: user.id,
          test_attempt_id: testAttemptId,
          question_id: q.id,
          topic: null,
          is_correct: rawAnswer === q.correct_option,
          user_answer: userAnswerLetter,
          correct_answer: correctAnswerLetter,
          participant_id: participantId,
          data_version: 'v2',
          is_reliable: qaReliable,
          time_spent_seconds: questionTimes[idx] || 0,
        };
      });
      await supabase.from('question_attempts').insert(questionAttemptsToInsert as any);

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
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => setShowExitDialog(true)} className="shrink-0 min-h-[44px] min-w-[44px] px-2 sm:px-3">
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
            <h1 className="font-semibold text-sm sm:text-base truncate hidden sm:block">{test?.title_ru || test?.title}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant={isPaused ? 'accent' : 'outline'}
              size="sm"
              onClick={togglePause}
              className="gap-1 min-h-[44px] px-2 sm:px-3"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="hidden sm:inline">{isPaused ? 'Продолжить' : 'Пауза'}</span>
            </Button>
            <Badge variant={isTimeWarning ? 'destructive' : isPaused ? 'outline' : 'secondary'} className={`text-base sm:text-lg px-2 sm:px-3 py-1 ${isPaused ? 'animate-pulse' : ''}`}>
              <Clock className="mr-1 sm:mr-2 h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
            <Badge variant="ghost" className="text-sm px-1.5 sm:px-2">
              {answeredCount}/{questions.length}
            </Badge>
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-1" />
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
                    className={`w-full rounded-lg border p-3 sm:p-4 text-left transition-all min-h-[48px] text-sm sm:text-base ${
                      answers[currentIndex] === index
                        ? 'border-accent bg-accent/10 ring-2 ring-accent'
                        : 'border-border hover:border-accent/50 hover:bg-muted/50'
                    }`}
                  >
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium shrink-0">
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
          <>
          {/* Question number grid - scrollable on mobile */}
          <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 min-w-0">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToQuestion(index)}
                  className={`h-9 w-9 sm:h-8 sm:w-8 rounded text-sm font-medium transition-colors shrink-0 ${
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

            {currentIndex === questions.length - 1 ? (
              <Button variant="accent" onClick={() => setShowExitDialog(true)} disabled={submitting} className="min-h-[44px]">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Завершить
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => navigateToQuestion(Math.min(questions.length - 1, currentIndex + 1))}
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
