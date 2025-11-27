import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MasteryLevel = 'mastered' | 'in-progress' | 'weak' | 'locked';

interface MasteryNodeProps {
  title: string;
  level: MasteryLevel;
  progress?: number;
  onClick?: () => void;
  className?: string;
}

const levelStyles: Record<MasteryLevel, string> = {
  mastered: 'bg-success text-success-foreground border-success',
  'in-progress': 'bg-warning text-warning-foreground border-warning',
  weak: 'bg-destructive text-destructive-foreground border-destructive',
  locked: 'bg-muted text-muted-foreground border-muted',
};

const levelIcons: Record<MasteryLevel, React.ReactNode> = {
  mastered: <Check className="h-4 w-4" />,
  'in-progress': <span className="text-xs font-bold">···</span>,
  weak: <span className="text-xs font-bold">!</span>,
  locked: <Lock className="h-3.5 w-3.5" />,
};

export function MasteryNode({ title, level, progress = 0, onClick, className }: MasteryNodeProps) {
  return (
    <button
      onClick={onClick}
      disabled={level === 'locked'}
      className={cn(
        'group relative flex flex-col items-center gap-2 transition-all',
        level !== 'locked' && 'hover:scale-105',
        className
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border-4 shadow-md transition-all',
          levelStyles[level],
          level !== 'locked' && 'group-hover:shadow-lg'
        )}
      >
        {levelIcons[level]}
      </div>
      <span className="max-w-[80px] text-center text-xs font-medium leading-tight">
        {title}
      </span>
      {level === 'in-progress' && (
        <div className="absolute -bottom-1 left-1/2 h-1 w-12 -translate-x-1/2 overflow-hidden rounded-full bg-warning/30">
          <div
            className="h-full bg-warning transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
}
