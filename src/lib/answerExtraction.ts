/**
 * Extract answer letter (A–E) from a free-text explanation.
 * Supports Latin and Cyrillic letters; returns Latin uppercase or null.
 *
 * Used to detect contradictions between `correct_answer` (source of truth)
 * and `correct_explanation` (free-form AI text).
 *
 * Mirrors the SQL function public.extract_answer_letter().
 */
const CYR_TO_LAT: Record<string, string> = {
  А: "A", Б: "B", В: "C", Г: "D", Д: "E",
};

const VALID = new Set(["A", "B", "C", "D", "E"]);

const PATTERNS: RegExp[] = [
  // "правильный ответ: B", "верный ответ — Б", "ответ: A", "ответ - В"
  /(?:правильн[а-яё]*\s+ответ|верн[а-яё]*\s+ответ|ответ)\s*[:\-—–]?\s*[«"(]?\s*([A-EА-ДЁ])/i,
  // "= B" or "≡ Б" near end of string
  /[=≡]\s*([A-EА-ДЁ])\s*[)\.,;!\?]?\s*$/i,
];

export function extractAnswerLetter(text: string | null | undefined): string | null {
  if (!text || !text.trim()) return null;
  for (const re of PATTERNS) {
    const m = text.match(re);
    if (m && m[1]) {
      const upper = m[1].toUpperCase();
      const lat = CYR_TO_LAT[upper] ?? upper;
      if (VALID.has(lat)) return lat;
    }
  }
  return null;
}

/**
 * Returns true if explanation is consistent with correct_answer
 * (or if no answer can be extracted from text — we don't penalize silence).
 */
export function isExplanationConsistent(
  explanation: string | null | undefined,
  correctAnswer: string | null | undefined,
): boolean {
  if (!correctAnswer) return true;
  const fromText = extractAnswerLetter(explanation);
  if (fromText === null) return true; // no claim made → not a conflict
  return fromText === correctAnswer.trim().toUpperCase();
}
