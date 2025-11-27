import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
  points: number;
  className?: string;
}

export function PointsDisplay({ points, className }: PointsDisplayProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 font-semibold text-accent',
        className
      )}
    >
      <Sparkles className="h-4 w-4" />
      <span>{points.toLocaleString()}</span>
    </div>
  );
}
