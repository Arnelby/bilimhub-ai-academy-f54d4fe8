import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, ArrowRight, CheckCircle2, BookOpen, Target,
  RefreshCw, ClipboardList, Lock, Play,
} from 'lucide-react';
import { useForcedLearning } from '@/hooks/useForcedLearning';
import { buildPlan, getNextTask, routeForTask, type Plan, type PlanTask, type TaskType } from '@/lib/taskEngine';

const TYPE_ICON: Record<TaskType, React.ReactNode> = {
  lesson:   <BookOpen className="h-5 w-5" />,
  practice: <Target className="h-5 w-5" />,
  repeat:   <RefreshCw className="h-5 w-5" />,
  test:     <ClipboardList className="h-5 w-5" />,
};

/**
 * Learning Plan = deterministic task queue.
 * NO advice. NO AI text. NO "why this matters". Just tasks.
 */
export default function LearningPlanV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAI, isControl, loading: groupLoading } = useUserGroup();
  const forced = useForcedLearning();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancel = false;
    const load = async () => {
      setLoading(true);
      const p = await buildPlan(user.id);
      if (!cancel) {
        setPlan(p);
        setLoading(false);
      }
    };
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    return () => { cancel = true; window.removeEventListener('focus', onFocus); };
  }, [user?.id]);

  // Control group: no plan engine
  if (!groupLoading && isControl && !isAI) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-12 px-4">
          <Card className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold">Свободный режим</h1>
            <p className="text-muted-foreground text-sm">
              План недоступен. Используй практику и общий контент.
            </p>
            <Button onClick={() => navigate('/practice')} className="w-full">
              К практике
            </Button>
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
  const completed = plan.done;
  const total = plan.total;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  const handleContinue = async () => {
    if (!next || !user?.id) return;
    console.log('[TASK_START]', { task_type: next.type, topic: next.topic });

    if (next.type === 'practice') {
      // Use forced learning loop as the executor
      if (forced.session) { navigate('/learn'); return; }
      await forced.start(next.topic);
      navigate('/learn');
      return;
    }
    navigate(routeForTask(next));
  };

  if (total === 0) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-12 px-4 space-y-6">
          <Card className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h1 className="text-2xl font-bold">План выполнен</h1>
            <p className="text-sm text-muted-foreground">Все слабые темы закрыты. Пройди контрольный тест.</p>
            <Button className="w-full" onClick={() => navigate('/tests')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              К тестам
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс плана</span>
            <span className="font-medium">{completed} / {total} · {pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Осталось задач: <span className="text-foreground font-medium">{remaining}</span>
          </p>
        </div>

        {/* Continue CTA */}
        {next && (
          <Card className="p-6 border-2 border-primary/40 bg-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                {TYPE_ICON[next.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold">Активная задача</p>
                <p className="font-medium truncate">{next.label}</p>
              </div>
            </div>
            <Button size="lg" onClick={handleContinue} className="w-full h-12 text-base">
              <Play className="mr-2 h-5 w-5" />
              Продолжить обучение
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        )}

        {/* Task list */}
        <div className="space-y-2">
          {plan.tasks.map((t, i) => (
            <TaskRow key={t.id} task={t} index={i + 1} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function TaskRow({ task, index }: { task: PlanTask; index: number }) {
  const isDone = task.status === 'done';
  const isActive = task.status === 'active';
  const isPending = task.status === 'pending';

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        isActive ? 'border-primary/60 bg-primary/5' : '',
        isDone ? 'opacity-60' : '',
        isPending ? 'opacity-70' : '',
      ].join(' ')}
    >
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
        {isDone ? <CheckCircle2 className="h-4 w-4 text-success" /> : index}
      </div>
      <div className="h-9 w-9 rounded-md bg-muted/60 flex items-center justify-center">
        {TYPE_ICON[task.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.label}</p>
        <p className="text-xs text-muted-foreground">
          {isActive ? 'Сейчас' : isDone ? 'Готово' : 'Заблокировано'}
        </p>
      </div>
      {isActive && <Badge variant="default">▶ АКТИВНО</Badge>}
      {isPending && <Lock className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}
