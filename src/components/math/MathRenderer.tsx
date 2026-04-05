import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
  /** Render inline (span) instead of block (div) */
  inline?: boolean;
}

/**
 * Normalize raw math-like text into valid LaTeX wrapped with $ delimiters.
 *
 * Handles patterns like:
 *   a/b          → $\frac{a}{b}$
 *   sqrt(x)      → $\sqrt{x}$
 *   fraction(a,b)→ $\frac{a}{b}$
 *
 * Already-delimited LaTeX ($...$, $$...$$) is left untouched.
 */
function normalizeMath(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // If already has proper LaTeX delimiters, leave untouched
  if (/\$/.test(text)) return text;

  // Step 1: Convert shorthand notation to LaTeX commands (NO delimiters yet)
  text = text.replace(/fraction\(([^,)]+),\s*([^)]+)\)/gi, '\\frac{$1}{$2}');
  text = text.replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
  text = text.replace(/\*\*/g, '^');

  // Step 2: Check if text now contains any math-worthy content
  const hasMath = /\\frac|\\sqrt|\^|(?<![a-zA-Z:\/])\d+\s*\/\s*\d+(?![a-zA-Z\/])/.test(text);

  if (hasMath) {
    // Convert standalone numeric fractions a/b → \frac{a}{b}
    text = text.replace(/(?<![a-zA-Z:\/\\])(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)(?![a-zA-Z\/])/g, '\\frac{$1}{$2}');
    // Wrap entire expression in single $ for inline KaTeX
    text = `$${text}$`;
  }

  return text;
}

export function MathRenderer({ content, className, inline = false }: MathRendererProps) {
  const normalized = useMemo(() => normalizeMath(content), [content]);

  const Tag = inline ? 'span' : 'div';

  return (
    <Tag
      className={cn(
        'math-renderer prose prose-sm dark:prose-invert max-w-none',
        '[&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_.katex]:text-inherit',
        inline && '[&_p]:inline [&>*]:inline',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalized}
      </ReactMarkdown>
    </Tag>
  );
}

export { normalizeMath };
