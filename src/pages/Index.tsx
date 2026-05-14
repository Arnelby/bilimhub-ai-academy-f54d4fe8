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
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useUserGroup } from '@/hooks/useUserGroup';
import { useLearningState } from '@/hooks/useLearningState';
import { useMotivation } from '@/hooks/useMotivation';
import { MotivationWidget } from '@/components/motivation/MotivationWidget';
import { nextActionRoute, type NextActionType, type PlanItem } from '@/lib/learningState';

const ACTION_ICONS: Record<NextActionType, React.ReactNode> = {
  take_test: <ClipboardList className="h-7 w-7" />,
  practice: <Target className="h-7 w-7" />,
  review_mistakes: <RefreshCw className="h-7 w-7" />,
  watch_lesson: <PlayCircle className="h-7 w-7" />,
  done: <CheckCircle2 className="h-7 w-7" />,
};

function GuestHero() {
  const { t } = useTranslation();
  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-6">
        <Badge variant="secondary" className="mx-auto">
          <Sparkles className="h-3 w-3 mr-1" />
          BilimHub
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold">
          {t('v2.home.guestTitle')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('v2.home.guestSubtitle')}
        </p>
        <Button size="lg" asChild>
          <Link to="/login">
            {t('v2.home.guestStart')} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </Layout>
  );
}

function ControlHome() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t('v2.home.controlTitle')}</h1>
          <p className="text-muted-foreground">{t('v2.home.controlSubtitle')}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/tests">
              <ClipboardList className="mr-3 h-6 w-6" />
              {t('v2.home.sectionTests')}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/lessons">
              <BookOpen className="mr-3 h-6 w-6" />
              {t('v2.home.sectionLessons')}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/practice">
              <Target className="mr-3 h-6 w-6" />
              {t('v2.home.sectionPractice')}
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 text-base justify-start">
            <Link to="/profile">
              <CheckCircle2 className="mr-3 h-6 w-6" />
              {t('v2.home.sectionProfile')}
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}

export default function Index() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isControl, loading: groupLoading } = useUserGroup();
  const { state, loading } = useLearningState(user?.id);
  const motivation = useMotivation(user?.id);

  const ACTION_LABEL: Record<NextActionType, string> = {
    take_test: t('v2.home.sectionTests'),
    practice: t('v2.home.sectionPractice'),
    review_mistakes: t('practice.mistakes.title'),
    watch_lesson: t('v2.home.sectionLessons'),
    done: t('v2.home.doneToday'),
  };

  const PLAN_ITEM_LABEL: Record<PlanItem['type'], string> = {
    lesson: t('v2.home.sectionLessons'),
    practice: t('v2.home.sectionPractice'),
    review: t('practice.mistakes.title'),
  };

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

  if (isControl) return <ControlHome />;

  const actionType: NextActionType = (state as any).next_action_type ?? 'take_test';
  const isCompleted = actionType === 'done';
  const route = nextActionRoute(state);

  const plan: PlanItem[] = Array.isArray(state.current_plan) ? (state.current_plan as PlanItem[]) : [];
  const weakTopics: string[] = Array.isArray(state.weak_topics) ? (state.weak_topics as string[]) : [];

  const handleContinue = () => {
    if (isCompleted) return;
    navigate(route);
  };

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-10 px-4 space-y-6">
        <Card className="border-2 shadow-lg overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {ACTION_ICONS[actionType]}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {isCompleted ? t('v2.home.doneToday') : t('v2.home.continueLearning')}
              </h1>
              <p className="text-muted-foreground text-base">{state.next_reason}</p>
            </div>

            {!isCompleted && (state as any).current_topic_progress && (
              <div className="rounded-lg border bg-muted/30 p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {t('v2.home.topic')}: {(state as any).current_topic_progress.topic}
                  </span>
                  <Badge variant={(state as any).current_topic_progress.needs_lesson ? 'destructive' : 'secondary'}>
                    {Math.round(((state as any).current_topic_progress.accuracy ?? 0) * 100)}{t('v2.home.accuracySuffix')}
                  </Badge>
                </div>
                <Progress value={(state as any).current_topic_progress.progress_pct} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('v2.home.attempts', { n: (state as any).current_topic_progress.total_attempts })}</span>
                  <span>{t('v2.home.attemptsLeft', { n: (state as any).current_topic_progress.attempts_left_estimate })}</span>
                </div>
              </div>
            )}

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
                {t('v2.home.openProgress')}
              </Button>
            )}

            {plan.length > 0 && !isCompleted && (
              <div className="pt-4 border-t">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                  {t('v2.home.todayPlan')}
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

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-accent" />
            <span className="font-medium text-foreground">{state.streak}</span> {t('v2.home.daysShort')}
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span className="font-medium text-foreground">{state.daily_progress}/{state.daily_goal}</span>
          </span>
          {weakTopics.length > 0 && (
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-destructive" />
              <span className="font-medium text-foreground">{weakTopics.length}</span> {t('v2.home.weakShort')}
            </span>
          )}
        </div>

        <Collapsible>
          <CollapsibleTrigger className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 select-none group">
            {t('v2.home.moreDetails')}
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {!motivation.loading && (
              <MotivationWidget
                streak={motivation.streak}
                tasksCompletedToday={motivation.tasksCompletedToday}
                dailyGoal={motivation.dailyGoal}
                goalCompleted={motivation.goalCompleted}
                activeDaysLast7={motivation.activeDaysLast7}
                warningLevel={motivation.warningLevel}
              />
            )}

            {weakTopics.length > 0 && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {t('v2.home.weakTopicsCount', { n: weakTopics.length })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {weakTopics.slice(0, 3).map((tp) => (
                      <Badge key={tp} variant="outline">
                        {tp}
                      </Badge>
                    ))}
                  </div>
                  {weakTopics.length > 3 && (
                    <Collapsible>
                      <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground">
                        {t('v2.home.showMore', { n: weakTopics.length - 3 })} ▾
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {weakTopics.slice(3).map((tp) => (
                            <Badge key={tp} variant="outline">
                              {tp}
                            </Badge>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/lessons">{t('v2.home.sectionLessons')}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tests">{t('v2.home.sectionTests')}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/practice">{t('v2.home.sectionPractice')}</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">{t('v2.home.sectionDashboard')}</Link>
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Layout>
  );
}
