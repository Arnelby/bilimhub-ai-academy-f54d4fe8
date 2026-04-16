/**
 * Normalize answer strings for consistent comparison.
 * Handles: whitespace, case, Cyrillic↔Latin mapping.
 */

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'А': 'A', 'Б': 'B', 'В': 'C', 'Г': 'D', 'Д': 'E',
  'а': 'A', 'б': 'B', 'в': 'C', 'г': 'D', 'д': 'E',
};

export function normalizeAnswer(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  let ans = raw.trim().toUpperCase();
  // Convert Cyrillic to Latin if needed
  if (CYRILLIC_TO_LATIN[ans]) {
    ans = CYRILLIC_TO_LATIN[ans];
  }
  // Only valid answers
  if (['A', 'B', 'C', 'D', 'E'].includes(ans)) return ans;
  return ans; // return as-is for non-standard
}

export function compareAnswers(userAnswer: string | null, correctAnswer: string | null): boolean {
  const normUser = normalizeAnswer(userAnswer);
  const normCorrect = normalizeAnswer(correctAnswer);
  if (normUser == null || normCorrect == null) return false;
  return normUser === normCorrect;
}
