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
 *   fraction(a,b) → $\frac{a}{b}$
 *   11^55        → $11^{55}$
 *   t^2021       → $t^{2021}$
 *   a_12         → $a_{12}$
 *
 * Already-delimited LaTeX ($...$, $$...$$) is left untouched.
 */
function normalizeMath(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 0a. Convert LaTeX-style delimiters that AI often emits into $ / $$
  //    \[ ... \]  → $$ ... $$    (block)
  //    \( ... \)  → $ ... $      (inline)
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner) => `$$${String(inner).trim()}$$`);
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner) => `$${String(inner).trim()}$`);

  // 0b. Drop stray ``` fences around math blocks
  text = text.replace(/```(?:math|latex)?\s*\n?([\s\S]*?)```/gi, (_m, inner) => String(inner));

  // 0b2. Repair a common AI failure mode: bare "/N" floating in prose (e.g. "дробь /2 означает")
  // and bare "a/b" with empty numerator. We can't recover the missing numerator, so we mark
  // it visually rather than letting KaTeX explode silently.
  text = text.replace(/(\s|^)\/(\d+)(\s|[.,;:!?)]|$)/g, '$1?/$2$3');

  // 0c. If number of unescaped $ is odd, escape the last lonely one so KaTeX doesn't eat the rest
  const dollarCount = (text.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 === 1) {
    text = text.replace(/(?<!\\)\$(?=[^$]*$)/, '\\$');
  }

  // 0d. AI often emits raw LaTeX commands (\frac{a}{b}, \sqrt{x}, x^{n}) without
  //     any $ delimiters. remark-math will then render them as literal text.
  //     Wrap each contiguous LaTeX-command run in $...$ so KaTeX picks it up.
  if (!/\$/.test(text) && /\\(?:frac|sqrt|cdot|times|div|leq|geq|neq|pm|mp|sum|int|infty|alpha|beta|gamma|theta|pi|sigma|approx|le|ge)\b|[A-Za-z0-9)\]]\s*\^\{[^}]*\}|[A-Za-z0-9)\]]\s*_\{[^}]*\}/.test(text)) {
    // Match a LaTeX expression: a leading command/sub/sup with all braced groups attached,
    // optionally followed by simple operators and more LaTeX/atoms. Conservative — keeps
    // surrounding prose untouched.
    const ATOM = String.raw`(?:\\[a-zA-Z]+(?:\{[^{}]*\})*|[A-Za-z0-9]+(?:\^\{[^{}]*\}|_\{[^{}]*\})+)`;
    const EXPR = new RegExp(`(${ATOM}(?:\\s*(?:[+\\-*/=<>]|\\\\(?:cdot|times|div|leq|geq|neq|pm|approx))\\s*${ATOM})*)`, 'g');
    text = text.replace(EXPR, (m) => `$${m}$`);
  }

  // If we now have proper LaTeX delimiters, fix multi-digit exponents/subscripts inside them
  if (/\$/.test(text)) {
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, inner: string) => {
      let fixed = inner;
      fixed = fixed.replace(/\^([A-Za-z0-9]{2,})(?![{}])/g, '^{$1}');
      fixed = fixed.replace(/_([A-Za-z0-9]{2,})(?![{}])/g, '_{$1}');
      return `$$${fixed}$$`;
    });
    text = text.replace(/(?<!\$)\$([^\n$]+?)\$(?!\$)/g, (_match, inner: string) => {
      let fixed = inner;
      fixed = fixed.replace(/\^([A-Za-z0-9]{2,})(?![{}])/g, '^{$1}');
      fixed = fixed.replace(/_([A-Za-z0-9]{2,})(?![{}])/g, '_{$1}');
      return `$${fixed}$`;
    });
    return text;
  }

  // Step 1: Convert shorthand notation to LaTeX commands (NO delimiters yet)
  text = text.replace(/fraction\(([^,)]+),\s*([^)]+)\)/gi, '\\frac{$1}{$2}');
  text = text.replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
  text = text.replace(/\*\*/g, '^');

  // Step 2: Multi-digit exponents
  text = text.replace(/\^([A-Za-z0-9]{2,})/g, '^{$1}');
  // Step 3: Multi-digit subscripts
  text = text.replace(/_([A-Za-z0-9]{2,})/g, '_{$1}');

  const hasLatexCommand = /\\frac|\\sqrt|\\cdot|\\times|\\div|\\leq|\\geq|\\neq|\\pm|\\mp|\\left|\\right|\\begin\{|\\end\{/.test(text);
  const hasStandaloneExponent = /(^|[^\p{L}])(?:[A-Za-z]\w*|\d+)\^[-(]?[A-Za-z0-9]+/u.test(text);
  const hasStandaloneSubscript = /(^|[^\p{L}])[A-Za-z]\w*_[A-Za-z0-9]+/u.test(text);
  const hasSimpleFraction = /(^|[^\p{L}:\/])\(?-?\d+(?:[.,]\d+)?\)?\s*\/\s*\(?-?\d+(?:[.,]\d+)?\)?(?![\p{L}\/])/u.test(text);
  const hasMath = hasLatexCommand || hasStandaloneExponent || hasStandaloneSubscript || hasSimpleFraction;

  if (hasMath) {
    text = text.replace(/(?<![a-zA-Z:\/\\])(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)(?![a-zA-Z\/])/g, '\\frac{$1}{$2}');
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
        'math-renderer prose prose-sm dark:prose-invert max-w-none break-words',
        '[&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_.katex]:text-inherit',
        // Make long display equations scroll horizontally instead of overflowing parent
        '[&_.katex-display]:overflow-x-auto [&_.katex-display]:max-w-full [&_.katex-display]:my-2',
        '[&_.katex]:whitespace-normal',
        '[overflow-wrap:anywhere]',
        inline && '[&_p]:inline [&>*]:inline',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[[remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, output: 'html' }]]}
      >
        {normalized}
      </ReactMarkdown>
    </Tag>
  );
}

export { normalizeMath };
