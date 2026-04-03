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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm',
          role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-muted'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_.katex]:text-inherit">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
      {role === 'user' && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
