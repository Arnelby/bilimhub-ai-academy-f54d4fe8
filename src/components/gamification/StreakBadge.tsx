import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakBadge({ streak, size = 'md', className }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-destructive font-bold',
        sizeClasses[size],
        streak > 0 && 'animate-pulse-glow',
        className
      )}
    >
      <Flame className={cn(iconSize[size], 'text-warning-foreground')} />
      <span className="text-warning-foreground">{streak}</span>
    </div>
  );
}
