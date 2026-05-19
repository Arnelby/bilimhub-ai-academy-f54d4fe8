import { Link } from 'react-router-dom';
import { Brain, Flame, Target, AlertTriangle, ArrowRight, Sparkles, CheckCircle2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { translateTopic } from '@/lib/topicTranslations';

interface WeakTopic {
  topic: string;
  accuracy: number;
}

interface LearningHeroProps {
  studentName?: string | null;
  masteryPercent: number | null;
  weakTopicsCount: number;
  streakDays: number;
  testsCompleted: number;
  topWeakTopic: WeakTopic | null;
  isAI: boolean;
}

export function LearningHero({
  studentName,
  masteryPercent,
  weakTopicsCount,
  streakDays,
  testsCompleted,
  topWeakTopic,
  isAI,
}: LearningHeroProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const masteryLabel = masteryPercent === null
    ? '—'
    : masteryPercent >= 80
      ? t('dashboardPage.hero.masteryStrong')
      : masteryPercent >= 60
        ? t('dashboardPage.hero.masteryGrowing')
        : t('dashboardPage.hero.masteryDeveloping');

  const recommended = topWeakTopic
    ? {
        title: t('dashboardPage.hero.recReviewTopic', {
          topic: translateTopic(topWeakTopic.topic, language as 'en' | 'ru' | 'kg'),
        }),
        reason: t('dashboardPage.hero.recReviewReason', { accuracy: topWeakTopic.accuracy }),
        cta: t('dashboardPage.hero.recPracticeCta'),
        to: isAI ? '/practice' : '/tests',
      }
    : testsCompleted === 0
      ? {
          title: t('dashboardPage.hero.recStartTitle'),
          reason: t('dashboardPage.hero.recStartReason'),
          cta: t('dashboardPage.hero.recStartCta'),
          to: '/tests',
        }
      : {
          title: t('dashboardPage.hero.recNextTestTitle'),
          reason: t('dashboardPage.hero.recNextTestReason'),
          cta: t('dashboardPage.hero.recNextTestCta'),
          to: '/tests',
        };

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-lg">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        {/* Left: progress overview */}
        <div>
          <Badge variant="outline" className="mb-3 border-white/30 bg-white/10 text-white backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3" />
            {t('dashboardPage.hero.badge')}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {studentName
              ? t('dashboardPage.hero.greetingNamed', { name: studentName })
              : t('dashboardPage.hero.greeting')}
          </h2>
          <p className="mt-1 text-sm text-white/80">{t('dashboardPage.hero.subtitle')}</p>

          {/* Mastery bar */}
          <div className="mt-6 rounded-xl bg-white/10 p-4 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white/90">{t('dashboardPage.hero.masteryLabel')}</span>
              <span className="text-2xl font-bold">{masteryPercent !== null ? `${masteryPercent}%` : '—'}</span>
            </div>
            <Progress value={masteryPercent ?? 0} className="h-2 bg-white/15 [&>div]:bg-white" />
            <p className="mt-2 text-xs text-white/70">{masteryLabel}</p>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <HeroStat icon={<Flame className="h-4 w-4" />} value={streakDays} label={t('dashboardPage.hero.streak')} />
            <HeroStat icon={<AlertTriangle className="h-4 w-4" />} value={weakTopicsCount} label={t('dashboardPage.hero.weakTopics')} />
            <HeroStat icon={<Activity className="h-4 w-4" />} value={testsCompleted} label={t('dashboardPage.hero.tests')} />
          </div>
        </div>

        {/* Right: recommended next step */}
        <div className="relative rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
            <Brain className="h-4 w-4" />
            {t('dashboardPage.hero.recommendedHeading')}
          </div>
          <h3 className="text-lg font-bold leading-snug">{recommended.title}</h3>
          <p className="mt-2 text-sm text-white/80">{recommended.reason}</p>

          <Button asChild size="lg" variant="secondary" className="mt-5 w-full bg-white text-primary hover:bg-white/90">
            <Link to={recommended.to}>
              {recommended.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/70">
            <Target className="h-3 w-3" />
            {t('dashboardPage.hero.adaptiveHint')}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3 text-center backdrop-blur">
      <div className="mb-1 flex items-center justify-center gap-1 text-white/80">{icon}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-white/70">{label}</div>
    </div>
  );
}

interface MasteryOverviewProps {
  topicAccuracy: { topic: string; accuracy: number; total: number }[];
}

export function MasteryOverview({ topicAccuracy }: MasteryOverviewProps) {
  const { t } = useTranslation();
  const eligible = topicAccuracy.filter((tp) => tp.total >= 3);
  const mastered = eligible.filter((tp) => tp.accuracy >= 80).length;
  const inProgress = eligible.filter((tp) => tp.accuracy >= 60 && tp.accuracy < 80).length;
  const needsReview = eligible.filter((tp) => tp.accuracy < 60).length;
  const total = mastered + inProgress + needsReview;

  if (total === 0) return null;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      <MasteryCard
        icon={<CheckCircle2 className="h-5 w-5" />}
        label={t('dashboardPage.mastery.mastered')}
        value={mastered}
        total={total}
        tone="success"
      />
      <MasteryCard
        icon={<Activity className="h-5 w-5" />}
        label={t('dashboardPage.mastery.inProgress')}
        value={inProgress}
        total={total}
        tone="warning"
      />
      <MasteryCard
        icon={<AlertTriangle className="h-5 w-5" />}
        label={t('dashboardPage.mastery.needsReview')}
        value={needsReview}
        total={total}
        tone="destructive"
      />
    </div>
  );
}

function MasteryCard({
  icon, label, value, total, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  tone: 'success' | 'warning' | 'destructive';
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const toneClasses = {
    success: 'border-success/30 bg-success/5 text-success [&>.bar>div]:bg-success',
    warning: 'border-warning/30 bg-warning/5 text-warning [&>.bar>div]:bg-warning',
    destructive: 'border-destructive/30 bg-destructive/5 text-destructive [&>.bar>div]:bg-destructive',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
      <Progress value={pct} className="bar mt-3 h-1.5 bg-muted" />
      <p className="mt-2 text-xs text-muted-foreground">{pct}%</p>
    </div>
  );
}
