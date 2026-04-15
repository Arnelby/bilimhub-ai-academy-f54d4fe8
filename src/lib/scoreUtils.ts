/**
 * Centralized score utilities.
 *
 * DB contract (going forward):
 *   score        = raw correct count (e.g. 24)
 *   total_questions = total (e.g. 30)
 *
 * Legacy rows may store score as a percentage (0-100).
 * We detect this by checking if score > total_questions.
 */

/** Convert a DB row's score to { correct, total, percentage }. */
export function parseScore(
  score: number | null | undefined,
  totalQuestions: number | null | undefined,
): { correct: number; total: number; percentage: number } {
  const total = totalQuestions || 30;
  const raw = score ?? 0;

  // Legacy detection: if raw > total, it was stored as percentage
  if (raw > total) {
    const correct = Math.round((raw / 100) * total);
    return { correct, total, percentage: Math.max(0, Math.min(100, raw)) };
  }

  const percentage = total > 0 ? Math.round((raw / total) * 100) : 0;
  return { correct: raw, total, percentage: Math.max(0, Math.min(100, percentage)) };
}

/** Format as "24/30 (80%)" */
export function formatScoreFull(score: number | null | undefined, total: number | null | undefined): string {
  const p = parseScore(score, total);
  return `${p.correct}/${p.total} (${p.percentage}%)`;
}
