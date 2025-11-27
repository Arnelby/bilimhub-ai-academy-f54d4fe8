import { Award, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AchievementCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  unlocked?: boolean;
  progress?: number;
  className?: string;
}

export function AchievementCard({
  title,
  description,
  icon,
  unlocked = false,
  progress = 0,
  className,
}: AchievementCardProps) {
  return (
    <Card
      variant={unlocked ? 'accent' : 'default'}
      className={cn(
        'relative overflow-hidden transition-all',
        unlocked && 'ring-2 ring-accent/50',
        !unlocked && 'opacity-60',
        className
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            unlocked ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {unlocked ? (
            icon || <Award className="h-6 w-6" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {!unlocked && progress > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        {unlocked && (
          <div className="absolute right-2 top-2">
            <span className="text-xs text-accent">✓</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
