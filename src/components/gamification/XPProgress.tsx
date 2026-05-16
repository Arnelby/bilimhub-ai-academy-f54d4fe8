import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface XPProgressProps {
  currentXP: number;
  level: number;
  className?: string;
}

const XP_PER_LEVEL = 500;

export function XPProgress({ currentXP, level, className }: XPProgressProps) {
  const { t } = useTranslation();
  const xpInCurrentLevel = currentXP % XP_PER_LEVEL;
  const progressPercentage = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground font-bold shadow-md">
            {level}
          </div>
          <span className="font-medium">Уровень {level}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>{xpInCurrentLevel}/{XP_PER_LEVEL} XP</span>
        </div>
      </div>
      <div className="relative">
        <Progress value={progressPercentage} className="h-3" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background text-xs font-bold">
            {level + 1}
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Еще {xpToNextLevel} XP до уровня {level + 1}
      </p>
    </div>
  );
}
