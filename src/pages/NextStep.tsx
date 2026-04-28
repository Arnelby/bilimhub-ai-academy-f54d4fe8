import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Loader2, ArrowRight, CheckCircle2, BookOpen, Target,
  RefreshCw, ClipboardList, Play,
} from 'lucide-react';
import { useForcedLearning } from '@/hooks/useForcedLearning';
import { buildPlan, getNextTask, routeForTask, type Plan, type TaskType } from '@/lib/taskEngine';

const TYPE_ICON: Record<TaskType, React.ReactNode> = {
  lesson:   <BookOpen className="h-6 w-6" />,
  practice: <Target className="h-6 w-6" />,
  repeat:   <RefreshCw className="h-6 w-6" />,
  test:     <ClipboardList className="h-6 w-6" />,
};

export default function NextStep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAI, isControl, loading: groupLoading } = useUserGroup();
  const forced = useForcedLearning();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancel = false;
    const load = async () => {
      setLoading(true);
      const p = await buildPlan(user.id);
      if (!cancel) { setPlan(p); setLoading(false); }
    };
    void load();
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

  // Control group: no engine
  if (!groupLoading && isControl && !isAI) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold">Свободный режим</h1>
            <p className="text-sm text-muted-foreground">Используй практику и общий контент.</p>
            <Button className="w-full" onClick={() => navigate('/practice')}>К практике</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading || !plan) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const next = getNextTask(plan);
  const isCompleted = !next;
  const total = plan.total;
  const completed = plan.done;
  const remaining = Math.max(0, total - completed);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleContinue = async () => {
    if (!next || !user?.id) return;
    console.log('[TASK_START]', { task_type: next.type, topic: next.topic });

    // Forced loop is the executor for practice tasks
    if (next.type === 'practice') {
      if (forced.session) { navigate('/learn'); return; }
      await forced.start(next.topic);
      navigate('/learn');
      return;
    }
    // If a forced session is already active (e.g. user paused), resume it
    if (forced.session) { navigate('/learn'); return; }
    navigate(routeForTask(next));
  };

  const ctaLabel = forced.session ? 'Продолжить обучение' : 'Начать обучение';
  const ctaIcon = next ? TYPE_ICON[next.type] : <CheckCircle2 className="h-6 w-6" />;
  const ctaReason = isCompleted
    ? 'План на сегодня выполнен'
    : next?.label ?? '';

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-12 px-4 space-y-6">
        {/* Micro-progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Прогресс плана</span>
            <span>{completed}/{total} · {pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <Card className="p-8 text-center space-y-6 shadow-lg border-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {ctaIcon}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isCompleted ? 'Готово!' : 'Следующая задача'}
            </h1>
            <p className="text-muted-foreground">{ctaReason}</p>
          </div>

          {!isCompleted && (
            <Button size="lg" onClick={handleContinue} className="w-full text-base h-14">
              <Play className="mr-2 h-5 w-5" />
              {ctaLabel}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}

          {isCompleted && (
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Открыть прогресс
            </Button>
          )}

          {!isCompleted && (
            <div className="pt-4 border-t text-sm text-muted-foreground">
              Осталось задач: <span className="text-foreground font-medium">{remaining}</span>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
