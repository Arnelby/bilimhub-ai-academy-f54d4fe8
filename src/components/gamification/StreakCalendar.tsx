import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  streak: number;
  lastActivityDate?: string | null;
  className?: string;
}

export function StreakCalendar({ streak, lastActivityDate, className }: StreakCalendarProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'kg' ? 'ky-KG' : 'ru-RU';
  const days = useMemo(() => {
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
      const isActive = i < streak;
      const isToday = i === 0;

      result.push({
        day: dayName,
        date: date.toISOString().split('T')[0],
        isActive,
        isToday,
      });
    }

    return result;
  }, [streak, locale]);

  const milestones = [
    { days: 3, label: t('gamification.milestone3'), reward: '+100 XP' },
    { days: 7, label: t('gamification.milestone7'), reward: '+200 XP' },
    { days: 30, label: t('gamification.milestone30'), reward: '+500 XP' },
  ];

  const nextMilestone = milestones.find(m => m.days > streak);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Streak display */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warning to-destructive shadow-lg">
          <Flame className="h-8 w-8 text-warning-foreground" />
        </div>
        <div>
          <p className="text-3xl font-bold">{streak}</p>
          <p className="text-sm text-muted-foreground">{t('gamification.streakDaysInRow')}</p>
        </div>
      </div>

      {/* Week calendar */}
      <div className="flex justify-center gap-2">
        {days.map((day, index) => (
          <div
            key={day.date}
            className={cn(
              'flex flex-col items-center gap-1',
              day.isToday && 'scale-110'
            )}
          >
            <span className="text-xs text-muted-foreground capitalize">
              {day.day}
            </span>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                day.isActive
                  ? 'bg-gradient-to-br from-warning to-destructive text-warning-foreground shadow-md'
                  : 'bg-muted text-muted-foreground',
                day.isToday && 'ring-2 ring-accent ring-offset-2 ring-offset-background'
              )}
            >
              {day.isActive ? (
                <Flame className="h-4 w-4" />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-sm text-muted-foreground">
            {t('gamification.untilReward')} <span className="font-semibold text-foreground">{nextMilestone.label}</span>
          </p>
          <p className="text-xs text-accent">
            {t('gamification.leftDaysReward', { n: nextMilestone.days - streak, reward: nextMilestone.reward })}
          </p>
        </div>
      )}

      {/* Milestones progress */}
      <div className="flex justify-between">
        {milestones.map((milestone) => {
          const isAchieved = streak >= milestone.days;
          return (
            <div
              key={milestone.days}
              className={cn(
                'flex flex-col items-center gap-1 transition-all',
                isAchieved ? 'opacity-100' : 'opacity-50'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
                  isAchieved
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {milestone.days}
              </div>
              <span className="text-xs text-muted-foreground">{milestone.reward}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
