import { normalizeAnswer } from '@/lib/answerNormalization';
import { toCyrillicKey } from '@/lib/mathTestConfig';

export function formatAnswerKey(raw: string | null | undefined, fallback = '—'): string {
  const normalized = normalizeAnswer(raw);
  return normalized ? toCyrillicKey(normalized) : fallback;
}

/**
 * Clean up AI/DB explanation text WITHOUT breaking LaTeX.
 * Math segments ($...$, $$...$$, \(...\), \[...\]) are extracted, prose around
 * them is normalized, then math is reinserted unchanged. This prevents the
 * "wall of broken \frac{0.1}{0.1}" rendering bug.
 */
export function sanitizeReviewText(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // 1. Base whitespace cleanup (safe for math too)
  let text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 2. Extract math segments → placeholders so prose rules never touch LaTeX
  const mathSegments: string[] = [];
  const MATH_RE = /\$\$[\s\S]+?\$\$|\$[^\n$]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g;
  text = text.replace(MATH_RE, (m) => {
    const idx = mathSegments.push(m) - 1;
    return `\u0000M${idx}\u0000`;
  });

  // 3. Prose-only fixes
  text = text.replace(
    /(Правильный ответ|Ответ|ответ|Вариант|вариант)\s*([:—-]?\s*)([ABCDE])\b/g,
    (_m, prefix: string, separator: string, letter: string) => `${prefix}${separator}${toCyrillicKey(letter)}`,
  );
  text = text.replace(/([«"“„])([ABCDE])([»"”“])/g, (_m, open: string, letter: string, close: string) => {
    return `${open}${toCyrillicKey(letter)}${close}`;
  });

  // Repair glued Cyrillic words (math already hidden behind placeholders)
  text = text.replace(/([а-яё])([А-ЯЁ])/g, '$1 $2');
  text = text.replace(/([.,;:!?])([А-ЯЁA-Z])/g, '$1 $2');
  text = text.replace(/(\d)([А-Яа-яЁё])/g, '$1 $2');
  text = text.replace(/([А-Яа-яЁё])(\d)/g, '$1 $2');

  // Paragraph breaks after sentence end
  text = text.replace(/([.!?])\s+([А-ЯЁA-Z])/g, '$1\n\n$2');
  text = text.replace(/\n{3,}/g, '\n\n');

  // 4. Restore math segments untouched, with safe whitespace around them
  text = text.replace(/\u0000M(\d+)\u0000/g, (_m, i: string) => mathSegments[Number(i)] ?? '');

  return text;
}
