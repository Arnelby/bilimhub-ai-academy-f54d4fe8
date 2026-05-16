import { useEffect, useState } from 'react';
import { Trophy, Flame, Star, Sparkles, Award, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type GamificationEventType = 
  | 'points_earned'
  | 'streak_milestone'
  | 'level_up'
  | 'achievement_unlocked'
  | 'lesson_completed'
  | 'test_completed'
  | 'perfect_score';

interface GamificationToastProps {
  type: GamificationEventType;
  value?: number | string;
  title?: string;
  description?: string;
  onComplete?: () => void;
}

const eventConfig: Record<GamificationEventType, {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
  titleKey: string;
}> = {
  points_earned: {
    icon: Sparkles,
    bgColor: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
    titleKey: 'gamification.pointsEarned',
  },
  streak_milestone: {
    icon: Flame,
    bgColor: 'from-warning/20 to-destructive/10',
    iconColor: 'text-warning',
    titleKey: 'gamification.streakMilestone',
  },
  level_up: {
    icon: Star,
    bgColor: 'from-success/20 to-success/5',
    iconColor: 'text-success',
    titleKey: 'gamification.levelUp',
  },
  achievement_unlocked: {
    icon: Trophy,
    bgColor: 'from-warning/30 to-warning/10',
    iconColor: 'text-warning',
    titleKey: 'gamification.achievementUnlocked',
  },
  lesson_completed: {
    icon: Award,
    bgColor: 'from-accent/20 to-success/10',
    iconColor: 'text-accent',
    titleKey: 'gamification.lessonCompleted',
  },
  test_completed: {
    icon: Zap,
    bgColor: 'from-success/20 to-accent/10',
    iconColor: 'text-success',
    titleKey: 'gamification.testCompleted',
  },
  perfect_score: {
    icon: Trophy,
    bgColor: 'from-warning/30 to-success/20',
    iconColor: 'text-warning',
    titleKey: 'gamification.perfectScore',
  },
};

export function GamificationToast({ 
  type, 
  value, 
  title, 
  description,
  onComplete 
}: GamificationToastProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const config = eventConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    // Animate in
    const showTimeout = setTimeout(() => setIsVisible(true), 50);
    
    // Start exit animation
    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
    }, 3000);

    // Complete and cleanup
    const completeTimeout = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(exitTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 min-w-[280px] max-w-sm',
        'transform transition-all duration-500 ease-out',
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className={cn(
        'rounded-xl border border-border/50 p-4 shadow-lg backdrop-blur-sm',
        'bg-gradient-to-r',
        config.bgColor
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            'bg-background/80 shadow-inner animate-bounce-slow'
          )}>
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">
              {title || config.defaultTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {description || (value && `+${value} XP`)}
            </p>
          </div>
          {value && typeof value === 'number' && (
            <div className="text-right">
              <span className="text-2xl font-bold text-accent animate-pulse">
                +{value}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
