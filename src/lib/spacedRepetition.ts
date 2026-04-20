import { supabase } from '@/integrations/supabase/client';
import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

/**
 * Per-question Learning State (deterministic, NO AI).
 *
 * Backed by `spaced_repetition` (extended in-place).
 * Status lifecycle:
 *   - new       → first time seen
 *   - failed    → wrong answer, scheduled +1 day, fail_count++
 *   - learning  → correct after a fail, scheduled +2 days
 *   - mastered  → success_streak >= 2, no further reviews
 *
 * Linked recovery resources:
 *   - linked_lesson_id  → first lesson for the question's topic
 *   - linked_video_id   → optional, set elsewhere (kept nullable here)
 *
 * Logs (per spec):
 *   [LEARNING_STATE_UPDATE] question_id status next_review_at
 *   [LEARNING_LOOP] event: fail | learn | retry | master
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function inDays(n: number | null): string | null {
  if (n === null) return null;
  return new Date(Date.now() + n * DAY_MS).toISOString();
}

// Cache topic→lesson_id map for the session to avoid hammering the DB.
let topicLessonCache: Record<string, string> | null = null;
async function topicToLesson(topicRaw: string | null | undefined): Promise<string | null> {
  if (!topicRaw) return null;
  if (!topicLessonCache) {
    const { data } = await supabase
      .from('lessons')
      .select('id, topics:topic_id (title, title_ru)');
    const map: Record<string, string> = {};
    for (const l of (data ?? []) as any[]) {
      const lid = l.id;
      if (!lid) continue;
      for (const t of [l.topics?.title, l.topics?.title_ru]) {
        if (!t) continue;
        const key = normalizeAnalyticsTopic(t);
        if (key && !map[key]) map[key] = lid;
      }
    }
    topicLessonCache = map;
  }
  const key = normalizeAnalyticsTopic(topicRaw);
  return topicLessonCache[key] ?? null;
}

export async function updateSpacedRepetition(params: {
  userId: string;
  questionId: string;
  isCorrect: boolean;
  topic?: string | null;
}): Promise<void> {
  const { userId, questionId, isCorrect, topic } = params;
  if (!userId || !questionId) return;

  const linkedLessonId = await topicToLesson(topic ?? null);

  const { data: existing, error: selErr } = await supabase
    .from('spaced_repetition' as any)
    .select('id, status, correct_streak, fail_count, success_streak')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (selErr) {
    console.error('[SPACED_SELECT] failed', selErr);
    return;
  }

  const nowIso = new Date().toISOString();
  const row = existing as any;

  // === WRONG ANSWER → status='failed', schedule +1 day ===
  if (!isCorrect) {
    const failCount = ((row?.fail_count as number) ?? 0) + 1;
    const next = inDays(1)!;
    const patch: any = {
      user_id: userId,
      question_id: questionId,
      status: 'failed',
      correct_streak: 0,
      success_streak: 0,
      fail_count: failCount,
      last_attempt_at: nowIso,
      next_review_date: next,
      topic: topic ?? row?.topic ?? null,
      linked_lesson_id: linkedLessonId ?? row?.linked_lesson_id ?? null,
    };
    const { error } = await supabase
      .from('spaced_repetition' as any)
      .upsert(patch, { onConflict: 'user_id,question_id' });
    if (error) {
      console.error('[SPACED_UPSERT_FAIL]', error);
      return;
    }
    console.log('[LEARNING_STATE_UPDATE]', {
      question_id: questionId,
      status: 'failed',
      next_review_at: next,
    });
    console.log('[LEARNING_LOOP]', { event: 'fail', question_id: questionId, topic });
    return;
  }

  // === CORRECT ANSWER ===
  const prevStreak = (row?.success_streak as number) ?? (row?.correct_streak as number) ?? 0;
  const newStreak = prevStreak + 1;

  if (newStreak >= 2) {
    // Mastered — keep row but mark mastered with no next review
    const patch: any = {
      user_id: userId,
      question_id: questionId,
      status: 'mastered',
      success_streak: newStreak,
      correct_streak: newStreak,
      last_attempt_at: nowIso,
      // next_review_date is NOT NULL in schema — push far into the future to mean "no review"
      next_review_date: inDays(3650)!,
      topic: topic ?? row?.topic ?? null,
      linked_lesson_id: linkedLessonId ?? row?.linked_lesson_id ?? null,
    };
    const { error } = await supabase
      .from('spaced_repetition' as any)
      .upsert(patch, { onConflict: 'user_id,question_id' });
    if (error) {
      console.error('[SPACED_UPSERT_MASTER]', error);
      return;
    }
    console.log('[LEARNING_STATE_UPDATE]', {
      question_id: questionId,
      status: 'mastered',
      next_review_at: null,
    });
    console.log('[LEARNING_LOOP]', { event: 'master', question_id: questionId, topic });
    return;
  }

  // First correct after a previous attempt → 'learning', schedule +2 days
  const next = inDays(2)!;
  const patch: any = {
    user_id: userId,
    question_id: questionId,
    status: 'learning',
    success_streak: newStreak,
    correct_streak: newStreak,
    last_attempt_at: nowIso,
    next_review_date: next,
    topic: topic ?? row?.topic ?? null,
    linked_lesson_id: linkedLessonId ?? row?.linked_lesson_id ?? null,
  };
  const { error } = await supabase
    .from('spaced_repetition' as any)
    .upsert(patch, { onConflict: 'user_id,question_id' });
  if (error) {
    console.error('[SPACED_UPSERT_LEARN]', error);
    return;
  }
  console.log('[LEARNING_STATE_UPDATE]', {
    question_id: questionId,
    status: 'learning',
    next_review_at: next,
  });
  const event = (row?.status === 'failed' || (row?.fail_count ?? 0) > 0) ? 'retry' : 'learn';
  console.log('[LEARNING_LOOP]', { event, question_id: questionId, topic });
}

/**
 * Returns the question_ids that are due for review:
 *   status in (failed, learning) AND next_review_date <= now
 */
export async function getDueRepetitionQuestions(userId: string): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('spaced_repetition' as any)
    .select('question_id, next_review_date, status')
    .eq('user_id', userId)
    .in('status', ['failed', 'learning'])
    .lte('next_review_date', new Date().toISOString());

  if (error) {
    console.error('[SPACED_FETCH_DUE] failed', error);
    return [];
  }
  return (data ?? []).map((r: any) => r.question_id as string);
}

/**
 * All currently failed question_ids for a user (ordered by most recent failure first).
 * Used by the "Repeat mistakes" flow on the practice results screen.
 */
export async function getFailedQuestions(userId: string): Promise<
  { question_id: string; topic: string | null; linked_lesson_id: string | null }[]
> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('spaced_repetition' as any)
    .select('question_id, topic, linked_lesson_id, last_attempt_at, status')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .order('last_attempt_at', { ascending: false });
  if (error) {
    console.error('[SPACED_FETCH_FAILED] failed', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    question_id: r.question_id,
    topic: r.topic ?? null,
    linked_lesson_id: r.linked_lesson_id ?? null,
  }));
}
