import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Target,
  Flame,
  TrendingUp,
  BookOpen,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { useLearningState } from '@/hooks/useLearningState';
import { nextActionRoute, type NextActionType, type PlanItem } from '@/lib/learningState';

const ACTION_ICONS: Record<NextActionType, React.ReactNode> = {
  take_test: <ClipboardList className="h-7 w-7" />,
  practice: <Target className="h-7 w-7" />,
  review_mistakes: <RefreshCw className="h-7 w-7" />,
  watch_lesson: <PlayCircle className="h-7 w-7" />,
  done: <CheckCircle2 className="h-7 w-7" />,
};

const ACTION_LABEL: Record<NextActionType, string> = {
  take_test: 'Пройти тест',
  practice: 'Практика',
  review_mistakes: 'Повторить ошибки',
  watch_lesson: 'Посмотреть урок',
  done: 'Готово',
};

const PLAN_ITEM_LABEL: Record<PlanItem['type'], string> = {
  lesson: 'Урок',
  practice: 'Практика',
  review: 'Повтор',
};

function GuestHero() {
  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-6">
        <Badge variant="secondary" className="mx-auto">
          <Sparkles className="h-3 w-3 mr-1" />
          BilimHub
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold">
          Подготовка к ОРТ — без хаоса
        </h1>
        <p className="text-lg text-muted-foreground">
          Платформа сама ведёт тебя: один шаг за раз. Тест → урок → практика → повтор.
        </p>
        <Button size="lg" asChild>
          <Link to="/login">
            Начать <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </Layout>
  );
}

/**
 * CONTROL group home — strictly minimal.
 * No next_action, no weak topics, no plan, no streak, no daily goal,
 * no motivation, no AI navigation. Only the four allowed sections.
 */
function ControlHome() {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">BilimHub</h1>
          <p className="text-muted-foreground">Подготовка к ОРТ. Выбери раздел.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/tests">
              <ClipboardList className="mr-3 h-6 w-6" />
              Тесты
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/lessons">
              <BookOpen className="mr-3 h-6 w-6" />
              Уроки
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/practice">
              <Target className="mr-3 h-6 w-6" />
              Практика
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/profile">
              <CheckCircle2 className="mr-3 h-6 w-6" />
              Профиль
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isControl, loading: groupLoading } = useUserGroup();
  const { state, loading } = useLearningState(user?.id);

  if (!user) return <GuestHero />;

  if (loading || groupLoading || !state) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  // CONTROL group → strictly basic view, no personalization signals.
  if (isControl) return <ControlHome />;

  const actionType: NextActionType = (state as any).next_action_type ?? 'take_test';
  const isCompleted = actionType === 'done';
  const route = nextActionRoute(state);
  const goalPct =
    state.daily_goal > 0
      ? Math.min(100, Math.round((state.daily_progress / state.daily_goal) * 100))
      : 0;

  const plan: PlanItem[] = Array.isArray(state.current_plan) ? (state.current_plan as PlanItem[]) : [];
  const weakTopics: string[] = Array.isArray(state.weak_topics) ? (state.weak_topics as string[]) : [];

  const handleContinue = () => {
    if (isCompleted) return;
    navigate(route);
  };

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-10 px-4 space-y-6">
        {/* Главная карточка */}
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {ACTION_ICONS[actionType]}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {isCompleted ? 'Готово на сегодня!' : 'Продолжить обучение'}
              </h1>
              <p className="text-muted-foreground text-base">{state.next_reason}</p>
            </div>

            {!isCompleted ? (
              <Button size="lg" onClick={handleContinue} className="w-full text-base h-14">
                {ACTION_LABEL[actionType]}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Открыть прогресс
              </Button>
            )}

            {/* План на сегодня */}
            {plan.length > 0 && !isCompleted && (
              <div className="pt-4 border-t">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  План сегодня
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {plan.slice(0, 6).map((p, i) => (
                    <Badge key={i} variant={i === 0 ? 'default' : 'secondary'} className="text-xs">
                      {PLAN_ITEM_LABEL[p.type]}
                      {p.topic ? `: ${p.topic}` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Краткий дашборд (читает только из state) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">{state.streak}</div>
                <div className="text-xs text-muted-foreground">дней подряд</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  Дневная цель
                </span>
                <span className="font-medium">
                  {state.daily_progress}/{state.daily_goal}
                </span>
              </div>
              <Progress value={goalPct} className="h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{weakTopics.length}</div>
                <div className="text-xs text-muted-foreground">слабых тем</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Слабые темы */}
        {weakTopics.length > 0 && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Слабые темы
              </div>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Подменю «больше» */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground text-center select-none">
            Больше разделов ▾
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/lessons">Уроки</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tests">Тесты</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/practice">Практика</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">Панель</Link>
            </Button>
          </div>
        </details>
      </div>
    </Layout>
  );
}
