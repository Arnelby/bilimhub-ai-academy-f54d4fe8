import { Flame, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MotivationWidgetProps {
  streak: number;
  tasksCompletedToday: number;
  dailyGoal: number;
  goalCompleted: boolean;
  activeDaysLast7: number;
  warningLevel: 'none' | 'soft' | 'strong' | 'risk';
  className?: string;
}

/**
 * Deterministic motivation widget. No AI. No copy generation.
 * Pulls all values from `user_activity` + dynamic active-days computation.
 */
export function MotivationWidget({
  streak,
  tasksCompletedToday,
  dailyGoal,
  goalCompleted,
  activeDaysLast7,
  warningLevel,
  className,
}: MotivationWidgetProps) {
  const { t } = useTranslation();
  const goalPct = Math.min(
    100,
    Math.round((tasksCompletedToday / Math.max(1, dailyGoal)) * 100)
  );

  const warningCopy: Record<typeof warningLevel, string | null> = {
    none: null,
    soft: t('gamification.warnSoft'),
    strong: t('gamification.warnStrong'),
    risk: t('gamification.warnRisk'),
  };

  return (
    <Card className={cn('border-border/60', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Top row — streak + active days */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-warning to-destructive shadow">
              <Flame className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">Серия: {streak} дней подряд</p>
              <p className="text-xs text-muted-foreground mt-1">
                Активных дней за 7: <span className="font-medium text-foreground">{activeDaysLast7}/7</span>
              </p>
            </div>
          </div>
          {goalCompleted && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Цель дня
            </Badge>
          )}
        </div>

        {/* Daily goal progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-4 w-4" />
              Цель дня
            </span>
            <span className="font-medium tabular-nums">
              {tasksCompletedToday} / {dailyGoal}
            </span>
          </div>
          <Progress
            value={goalPct}
            indicatorColor={goalCompleted ? 'success' : 'gradient'}
            className="h-2"
          />
        </div>

        {/* Warning */}
        {warningCopy[warningLevel] && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-md p-2.5 text-sm',
              warningLevel === 'risk' && 'bg-destructive/10 text-destructive',
              warningLevel === 'strong' && 'bg-warning/15 text-warning-foreground',
              warningLevel === 'soft' && 'bg-muted text-muted-foreground'
            )}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warningCopy[warningLevel]}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
