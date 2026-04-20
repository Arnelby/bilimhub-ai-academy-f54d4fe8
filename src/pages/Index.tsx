import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useLearningState } from '@/hooks/useLearningState';
import { nextActionLabel, nextActionRoute, type NextAction } from '@/lib/learningState';
import { useNavigate } from 'react-router-dom';

const ICONS: Record<NextAction, React.ReactNode> = {
  test: <ClipboardList className="h-7 w-7" />,
  practice: <Target className="h-7 w-7" />,
  review_errors: <RefreshCw className="h-7 w-7" />,
  completed: <CheckCircle2 className="h-7 w-7" />,
};

const STEP_ORDER: Array<{ key: NextAction; label: string }> = [
  { key: 'test', label: 'Тест' },
  { key: 'practice', label: 'Практика' },
  { key: 'review_errors', label: 'Повтор ошибок' },
];

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
          Платформа сама ведёт тебя: один шаг за раз. Тест → практика → повтор ошибок.
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

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state, loading } = useLearningState(user?.id);

  if (!user) return <GuestHero />;

  if (loading || !state) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const isCompleted = state.next_action === 'completed';
  const route = nextActionRoute(state);
  const goalPct = state.daily_goal > 0
    ? Math.min(100, Math.round((state.daily_progress / state.daily_goal) * 100))
    : 0;

  // Шаг N из 3 (test=1, practice=2, review_errors=3)
  const stepNumber: Record<NextAction, number> = {
    test: 1,
    practice: 2,
    review_errors: 3,
    completed: 3,
  };
  const currentStepNum = stepNumber[state.next_action];

  const upcoming = STEP_ORDER.filter((s) => stepNumber[s.key] > currentStepNum);

  const handleContinue = () => {
    if (isCompleted) return;
    navigate(route);
  };

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-10 px-4 space-y-6">
        {/* Шаги */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-16 rounded-full transition-colors ${
                i <= currentStepNum ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Шаг {currentStepNum} из 3
        </p>

        {/* Главная карточка */}
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {ICONS[state.next_action]}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {isCompleted ? 'Готово на сегодня!' : 'Продолжить обучение'}
              </h1>
              <p className="text-muted-foreground text-base">
                {state.next_reason}
              </p>
            </div>

            {!isCompleted ? (
              <Button
                size="lg"
                onClick={handleContinue}
                className="w-full text-base h-14"
              >
                Продолжить обучение
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

            {/* Подсказки */}
            {!isCompleted && (
              <div className="pt-4 border-t space-y-1.5 text-sm text-muted-foreground">
                <p>
                  Дальше:{' '}
                  <span className="text-foreground font-medium">
                    {nextActionLabel(state.next_action)}
                  </span>
                </p>
                {upcoming.length > 0 && (
                  <p>
                    После этого:{' '}
                    <span className="text-foreground font-medium">
                      {upcoming.map((u) => u.label.toLowerCase()).join(' → ')}
                    </span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Краткий дашборд */}
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
                <div className="text-2xl font-bold">{state.weak_topics.length}</div>
                <div className="text-xs text-muted-foreground">слабых тем</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Текущая тема */}
        {state.current_topic && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Текущая тема</div>
                <div className="font-medium">{state.current_topic}</div>
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
