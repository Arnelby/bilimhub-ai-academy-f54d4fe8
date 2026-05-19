import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { MathRenderer } from '@/components/math/MathRenderer';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={cn('flex gap-3', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-white shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          role === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border/70 text-foreground rounded-tl-sm'
        )}
      >
        <MathRenderer content={content} />
      </div>
      {role === 'user' && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
