import { normalizeAnswer } from '@/lib/answerNormalization';
import { toCyrillicKey } from '@/lib/mathTestConfig';

export function formatAnswerKey(raw: string | null | undefined, fallback = '—'): string {
  const normalized = normalizeAnswer(raw);
  return normalized ? toCyrillicKey(normalized) : fallback;
}

export function sanitizeReviewText(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  text = text.replace(
    /(Правильный ответ|Ответ|ответ|Вариант|вариант)\s*([:—-]?\s*)([ABCDE])\b/g,
    (_m, prefix: string, separator: string, letter: string) => `${prefix}${separator}${toCyrillicKey(letter)}`,
  );

  text = text.replace(/([«"“„])([ABCDE])([»"”“])/g, (_m, open: string, letter: string, close: string) => {
    return `${open}${toCyrillicKey(letter)}${close}`;
  });

  text = text.replace(/([А-Яа-яA-Za-z0-9)])\$(?=\S)/g, '$1 $');
  text = text.replace(/(?<=\S)\$([А-Яа-яA-Za-z0-9(])/g, '$ $1');

  return text;
}