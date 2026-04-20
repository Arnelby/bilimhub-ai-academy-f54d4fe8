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

  // Repair AI-generated text with missing spaces between glued Cyrillic words.
  // Pattern: lowercase letter immediately followed by uppercase letter (e.g. "ОтветАбудет" → "Ответ А будет")
  text = text.replace(/([а-яё])([А-ЯЁ])/g, '$1 $2');
  // Also: punctuation glued to next word (e.g. ".Это" → ". Это")
  text = text.replace(/([.,;:!?])([А-ЯЁA-Z])/g, '$1 $2');
  // Number glued to following Cyrillic letter (e.g. "84градуса" → "84 градуса")
  text = text.replace(/(\d)([А-Яа-яЁё])/g, '$1 $2');
  // Cyrillic letter glued to a following number (e.g. "ответ48" → "ответ 48")
  text = text.replace(/([А-Яа-яЁё])(\d)/g, '$1 $2');

  // Insert paragraph breaks after sentence-ending punctuation when followed by capital letter
  // (improves readability of long AI/DB explanations that come as one wall of text)
  text = text.replace(/([.!?])\s+([А-ЯЁA-Z])/g, '$1\n\n$2');
  // Collapse 3+ newlines back to 2
  text = text.replace(/\n{3,}/g, '\n\n');

  return text;
}