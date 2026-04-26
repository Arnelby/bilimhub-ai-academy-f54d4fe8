import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowRight, CheckCircle2, Target, RefreshCw, ClipboardList, PlayCircle, BookOpen, ShieldCheck } from 'lucide-react';
import { getNextAction, nextActionLabel, type NextStepResult, type NextAction } from '@/lib/nextStepEngine';
import { useMotivation } from '@/hooks/useMotivation';
import { getLearningState, nextActionRoute, type LearningState } from '@/lib/learningState';
import { getMasteryLoopState, masteryPhaseRoute, recomputeMasteryState, type MasteryLoopState } from '@/lib/masteryLoop';

const ICONS: Record<NextAction, React.ReactNode> = {
  test: <ClipboardList className="h-6 w-6" />,
  practice: <Target className="h-6 w-6" />,
  review_errors: <RefreshCw className="h-6 w-6" />,
  completed: <CheckCircle2 className="h-6 w-6" />,
};

const MASTERY_ICONS = {
  lesson: <BookOpen className="h-6 w-6" />,
  practice: <Target className="h-6 w-6" />,
  validation: <ShieldCheck className="h-6 w-6" />,
  done: <CheckCircle2 className="h-6 w-6" />,
} as const;

export default function NextStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<NextStepResult | null>(null);
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);
  const motivation = useMotivation(user?.id);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    const load = async () => {
      setLoading(true);
      // Fetch both the legacy result (for step indicator) AND the rich state
      // (for routing — only the rich state knows about watch_lesson + next_target).
      const [result, fullState] = await Promise.all([
        getNextAction(user.id),
        getLearningState(user.id),
      ]);
      if (!cancel) {
        setStep(result);
        setState(fullState);
        setLoading(false);
      }
    };
    void load();
    // Auto-refresh on focus / visibility — reflects practice/test progress immediately.
    const onFocus = () => { void load(); };
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancel = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id]);

  const handleContinue = () => {
    if (!step) return;
    // PRIORITY 1: rich state knows about watch_lesson, real lesson IDs and topic targets.
    if (state) {
      const route = nextActionRoute(state);
      console.log('[NEXT_STEP_NAV]', { type: state.next_action_type, target: state.next_target, route });
      navigate(route);
      return;
    }
    // Fallback to legacy enum
    switch (step.next_action) {
      case 'test':
        navigate('/tests');
        break;
      case 'practice':
        if (step.weak_topic) {
          navigate(`/practice?topic=${encodeURIComponent(step.weak_topic)}`);
        } else {
          navigate('/practice');
        }
        break;
      case 'review_errors':
        navigate('/practice?mode=review');
        break;
      case 'completed':
        // stay
        break;
    }
  };

  // Determine the CTA label/icon based on the rich action type when available.
  const isWatchLesson = state?.next_action_type === 'watch_lesson';
  const ctaIcon = isWatchLesson ? <PlayCircle className="h-6 w-6" /> : (step ? ICONS[step.next_action] : null);
  const ctaLabel = isWatchLesson ? 'Смотреть урок' : 'Продолжить обучение';

  if (loading || !step) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const tasksLeft = motivation
    ? Math.max(0, motivation.dailyGoal - motivation.tasksCompletedToday)
    : null;

  const isCompleted = step.next_action === 'completed';

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-12 px-4 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                i <= step.step_index ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Шаг {step.step_index} из {step.total_steps}
        </p>

        {/* Main card */}
        <Card className="p-8 text-center space-y-6 shadow-lg border-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {ctaIcon}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isCompleted ? 'Готово на сегодня!' : 'Твой следующий шаг'}
            </h1>
            <p className="text-muted-foreground">
              {state?.next_reason || step.reason}
            </p>
          </div>

          {!isCompleted && (
            <Button size="lg" onClick={handleContinue} className="w-full text-base h-14">
              {ctaLabel}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}

          {isCompleted && (
            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Открыть прогресс
              </Button>
            </div>
          )}

          {/* Sub info */}
          {!isCompleted && (
            <div className="pt-4 border-t space-y-1.5 text-sm text-muted-foreground">
              {tasksLeft !== null && (
                <p>Сегодня осталось: <span className="text-foreground font-medium">{tasksLeft}</span> задач</p>
              )}
              <p>
                Следующий шаг:{' '}
                <span className="text-foreground font-medium">{nextActionLabel(step.next_action)}</span>
              </p>
              {step.upcoming.length > 0 && (
                <p>
                  После этого:{' '}
                  <span className="text-foreground font-medium">
                    {step.upcoming.map(nextActionLabel).join(' → ')}
                  </span>
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
