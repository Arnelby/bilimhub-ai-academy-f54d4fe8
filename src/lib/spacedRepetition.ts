import { supabase } from '@/integrations/supabase/client';

/**
 * Deterministic spaced repetition (NO AI).
 *
 * Rules:
 *  - No row yet + WRONG  → create row {status:'learning', streak:0, +1 day}
 *  - No row yet + CORRECT → create row {status:'new', streak:1, +2 days}
 *      (so a single correct first attempt still gets one short review;
 *       a second correct removes it. Matches spec: streak>=2 → DELETE.)
 *  - Existing row + WRONG → status='learning', streak=0, next=+1 day
 *  - Existing row + CORRECT:
 *      streak += 1
 *      if streak == 1 → status='review', next=+2 days
 *      if streak >= 2 → DELETE row (mastered)
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function inDays(n: number): string {
  return new Date(Date.now() + n * DAY_MS).toISOString();
}

export async function updateSpacedRepetition(params: {
  userId: string;
  questionId: string;
  isCorrect: boolean;
}): Promise<void> {
  const { userId, questionId, isCorrect } = params;
  if (!userId || !questionId) return;

  // Read current row (if any)
  const { data: existing, error: selErr } = await supabase
    .from('spaced_repetition' as any)
    .select('id, status, correct_streak')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (selErr) {
    console.error('[SPACED_SELECT] failed', selErr);
    return;
  }

  // No existing record → create
  if (!existing) {
    if (isCorrect) {
      // First-time correct: schedule one review then it will be deleted on streak>=2
      const row = {
        user_id: userId,
        question_id: questionId,
        status: 'review',
        correct_streak: 1,
        next_review_date: inDays(2),
      };
      const { error } = await supabase.from('spaced_repetition' as any).insert(row);
      if (error) console.error('[SPACED_CREATE] failed', error);
      else console.log('[SPACED_CREATE]', { user_id: userId, question_id: questionId, ...row });
      return;
    }
    const row = {
      user_id: userId,
      question_id: questionId,
      status: 'learning',
      correct_streak: 0,
      next_review_date: inDays(1),
    };
    const { error } = await supabase.from('spaced_repetition' as any).insert(row);
    if (error) console.error('[SPACED_CREATE] failed', error);
    else console.log('[SPACED_CREATE]', { user_id: userId, question_id: questionId, ...row });
    return;
  }

  const row = existing as { id: string; status: string; correct_streak: number };

  // Existing + WRONG → reset to learning
  if (!isCorrect) {
    const patch = {
      status: 'learning',
      correct_streak: 0,
      next_review_date: inDays(1),
    };
    const { error } = await supabase
      .from('spaced_repetition' as any)
      .update(patch)
      .eq('id', row.id);
    if (error) console.error('[SPACED_UPDATE] failed', error);
    else
      console.log('[SPACED_UPDATE]', {
        question_id: questionId,
        ...patch,
      });
    return;
  }

  // Existing + CORRECT
  const newStreak = (row.correct_streak ?? 0) + 1;

  if (newStreak >= 2) {
    const { error } = await supabase
      .from('spaced_repetition' as any)
      .delete()
      .eq('id', row.id);
    if (error) console.error('[SPACED_DELETE] failed', error);
    else console.log('[SPACED_DELETE]', { question_id: questionId });
    return;
  }

  // newStreak === 1 → schedule a review in 2 days
  const patch = {
    status: 'review',
    correct_streak: newStreak,
    next_review_date: inDays(2),
  };
  const { error } = await supabase
    .from('spaced_repetition' as any)
    .update(patch)
    .eq('id', row.id);
  if (error) console.error('[SPACED_UPDATE] failed', error);
  else
    console.log('[SPACED_UPDATE]', {
      question_id: questionId,
      ...patch,
    });
}

/**
 * Returns the list of question_ids that are due for review for this user
 * (next_review_date <= now). Caller can use these to prioritize selection.
 */
export async function getDueRepetitionQuestions(userId: string): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('spaced_repetition' as any)
    .select('question_id, next_review_date')
    .eq('user_id', userId)
    .lte('next_review_date', new Date().toISOString());

  if (error) {
    console.error('[SPACED_FETCH_DUE] failed', error);
    return [];
  }
  return (data ?? []).map((r: any) => r.question_id as string);
}
