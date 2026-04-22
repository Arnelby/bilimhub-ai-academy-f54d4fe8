import { supabase } from '@/integrations/supabase/client';
import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

/**
 * MASTERY MODE — deterministic, NO AI.
 *
 * Rule:
 *   topic is "mastered" when accuracy >= 0.8 AND total_attempts >= 10
 *
 * Status machine:
 *   new       → first attempt logged
 *   learning  → 1..9 attempts
 *   mastering → ≥10 attempts but accuracy < 0.8
 *   mastered  → accuracy ≥ 0.8 AND attempts ≥ 10
 *
 * Lesson trigger (needs_lesson = true):
 *   accuracy < 0.5 OR consecutive_wrong ≥ 3
 *
 * Mistake queue:
 *   wrong answer → upsert row, correct_streak = 0
 *   correct answer on a queued question → correct_streak += 1
 *   resolved when correct_streak ≥ 2
 */

export const MASTERY_TARGET_ACCURACY = 0.8;
export const MASTERY_MIN_ATTEMPTS = 10;
export const LESSON_LOW_ACCURACY = 0.5;
export const LESSON_CONSECUTIVE_WRONG = 3;
export const MISTAKE_RESOLVE_STREAK = 2;
export const SESSION_SIZE = 10;

export type MasteryStatus = 'new' | 'learning' | 'mastering' | 'mastered';

export interface TopicMasteryRow {
  topic: string;
  status: MasteryStatus;
  total_attempts: number;
  correct_answers: number;
  accuracy: number;
  consecutive_wrong: number;
  needs_lesson: boolean;
  last_lesson_watched_at: string | null;
  mastered_at: string | null;
}

function deriveStatus(accuracy: number, attempts: number): MasteryStatus {
  if (attempts === 0) return 'new';
  if (accuracy >= MASTERY_TARGET_ACCURACY && attempts >= MASTERY_MIN_ATTEMPTS) return 'mastered';
  if (attempts >= MASTERY_MIN_ATTEMPTS) return 'mastering';
  return 'learning';
}

/**
 * Called after EVERY practice answer.
 * Updates topic_mastery_state + mistake_queue atomically (best-effort, RLS-protected).
 */
export async function recordMasteryAttempt(params: {
  userId: string;
  topic: string | null | undefined;
  questionId: string | null | undefined;
  isCorrect: boolean;
}): Promise<void> {
  const { userId, isCorrect } = params;
  const topic = normalizeAnalyticsTopic(params.topic || '');
  if (!userId || !topic) return;

  // ---- topic_mastery_state ----
  const { data: existing } = await supabase
    .from('topic_mastery_state' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('topic', topic)
    .maybeSingle();

  let row = existing as any;
  const total = (row?.total_attempts ?? 0) + 1;
  const correct = (row?.correct_answers ?? 0) + (isCorrect ? 1 : 0);
  const accuracy = total > 0 ? correct / total : 0;
  const consecutive_wrong = isCorrect ? 0 : (row?.consecutive_wrong ?? 0) + 1;
  const needs_lesson =
    (accuracy < LESSON_LOW_ACCURACY && total >= 4) ||
    consecutive_wrong >= LESSON_CONSECUTIVE_WRONG;
  const status = deriveStatus(accuracy, total);
  const mastered_at =
    status === 'mastered' && !row?.mastered_at ? new Date().toISOString() : row?.mastered_at ?? null;

  if (!row) {
    await supabase.from('topic_mastery_state' as any).insert({
      user_id: userId,
      topic,
      status,
      total_attempts: total,
      correct_answers: correct,
      accuracy,
      consecutive_wrong,
      needs_lesson,
      mastered_at,
    });
  } else {
    await supabase
      .from('topic_mastery_state' as any)
      .update({
        status,
        total_attempts: total,
        correct_answers: correct,
        accuracy,
        consecutive_wrong,
        needs_lesson,
        mastered_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
  }

  console.log('[MASTERY_UPDATE]', { user_id: userId, topic, status, accuracy: +accuracy.toFixed(2), attempts: total, needs_lesson });

  // ---- mistake_queue ----
  const qid = (params.questionId || '').toString();
  if (!qid) return;

  const { data: q } = await supabase
    .from('mistake_queue' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', qid)
    .maybeSingle();

  if (!isCorrect) {
    if (!q) {
      await supabase.from('mistake_queue' as any).insert({
        user_id: userId,
        question_id: qid,
        topic,
        correct_streak: 0,
        total_attempts: 1,
        resolved: false,
      });
    } else {
      await supabase
        .from('mistake_queue' as any)
        .update({
          correct_streak: 0,
          total_attempts: ((q as any).total_attempts ?? 0) + 1,
          resolved: false,
          resolved_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (q as any).id);
    }
    console.log('[MISTAKE_QUEUE_ADD]', { question_id: qid, topic });
  } else if (q) {
    const streak = ((q as any).correct_streak ?? 0) + 1;
    const resolved = streak >= MISTAKE_RESOLVE_STREAK;
    await supabase
      .from('mistake_queue' as any)
      .update({
        correct_streak: streak,
        total_attempts: ((q as any).total_attempts ?? 0) + 1,
        resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (q as any).id);
    console.log('[MISTAKE_QUEUE_PROGRESS]', { question_id: qid, streak, resolved });
  }
}

export async function getAllMastery(userId: string): Promise<TopicMasteryRow[]> {
  if (!userId) return [];
  const { data } = await supabase
    .from('topic_mastery_state' as any)
    .select('topic, status, total_attempts, correct_answers, accuracy, consecutive_wrong, needs_lesson, last_lesson_watched_at, mastered_at')
    .eq('user_id', userId);
  return (data ?? []) as unknown as TopicMasteryRow[];
}

/**
 * Pick the FORCED topic the user must work on right now.
 * Rule: weakest unmastered topic (lowest accuracy first).
 * Returns null only if every started topic is mastered.
 */
export async function selectForcedTopic(userId: string): Promise<TopicMasteryRow | null> {
  const rows = await getAllMastery(userId);
  const unmastered = rows.filter((r) => r.status !== 'mastered');
  if (unmastered.length === 0) return null;
  unmastered.sort((a, b) => {
    // priority: needs_lesson first, then lowest accuracy, then most attempts (closer to threshold)
    if (a.needs_lesson !== b.needs_lesson) return a.needs_lesson ? -1 : 1;
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
    return b.total_attempts - a.total_attempts;
  });
  return unmastered[0];
}

export interface MasteryProgress {
  topic: string;
  status: MasteryStatus;
  accuracy: number;
  total_attempts: number;
  correct_answers: number;
  attempts_left_estimate: number; // sessions of 10 to reach mastered
  needs_lesson: boolean;
  progress_pct: number; // 0..100 toward mastery
}

export function computeProgress(row: TopicMasteryRow): MasteryProgress {
  // Progress = max(accuracy/0.8, attempts/10) clamped so both gates count.
  const accGate = Math.min(1, row.accuracy / MASTERY_TARGET_ACCURACY);
  const attGate = Math.min(1, row.total_attempts / MASTERY_MIN_ATTEMPTS);
  const progress = Math.round(Math.min(accGate, attGate) * 100);

  // Estimate attempts left:
  //   need at least MASTERY_MIN_ATTEMPTS attempts AND accuracy ≥ 0.8.
  //   Naive forecast assumes user maintains current accuracy on new attempts.
  let attemptsNeededByAttempts = Math.max(0, MASTERY_MIN_ATTEMPTS - row.total_attempts);
  let attemptsNeededByAccuracy = 0;
  if (row.accuracy < MASTERY_TARGET_ACCURACY) {
    // minimal additional perfect answers x s.t. (correct+x)/(total+x) >= 0.8
    // => x >= (0.8*total - correct) / 0.2
    const need = Math.ceil((MASTERY_TARGET_ACCURACY * row.total_attempts - row.correct_answers) / 0.2);
    attemptsNeededByAccuracy = Math.max(0, need);
  }
  const attemptsLeft = Math.max(attemptsNeededByAttempts, attemptsNeededByAccuracy);
  const sessionsLeft = Math.max(1, Math.ceil(attemptsLeft / SESSION_SIZE));

  return {
    topic: row.topic,
    status: row.status,
    accuracy: row.accuracy,
    total_attempts: row.total_attempts,
    correct_answers: row.correct_answers,
    attempts_left_estimate: sessionsLeft,
    needs_lesson: row.needs_lesson,
    progress_pct: progress,
  };
}

export async function getMasteryForTopic(
  userId: string,
  topic: string,
): Promise<TopicMasteryRow | null> {
  if (!userId || !topic) return null;
  const t = normalizeAnalyticsTopic(topic);
  const { data } = await supabase
    .from('topic_mastery_state' as any)
    .select('topic, status, total_attempts, correct_answers, accuracy, consecutive_wrong, needs_lesson, last_lesson_watched_at, mastered_at')
    .eq('user_id', userId)
    .eq('topic', t)
    .maybeSingle();
  return (data as unknown as TopicMasteryRow) || null;
}

/** Mark lesson watched for a topic — clears needs_lesson + consecutive_wrong. */
export async function markTopicLessonWatched(userId: string, topic: string): Promise<void> {
  if (!userId || !topic) return;
  const t = normalizeAnalyticsTopic(topic);
  const { data: row } = await supabase
    .from('topic_mastery_state' as any)
    .select('id')
    .eq('user_id', userId)
    .eq('topic', t)
    .maybeSingle();
  if (!row) {
    await supabase.from('topic_mastery_state' as any).insert({
      user_id: userId,
      topic: t,
      status: 'learning',
      needs_lesson: false,
      consecutive_wrong: 0,
      last_lesson_watched_at: new Date().toISOString(),
    });
    return;
  }
  await supabase
    .from('topic_mastery_state' as any)
    .update({
      needs_lesson: false,
      consecutive_wrong: 0,
      last_lesson_watched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', (row as any).id);
}

/** Unresolved mistake question_ids for a given topic, oldest first. */
export async function getMistakeQueueForTopic(
  userId: string,
  topic: string,
  limit = SESSION_SIZE,
): Promise<string[]> {
  if (!userId || !topic) return [];
  const t = normalizeAnalyticsTopic(topic);
  const { data } = await supabase
    .from('mistake_queue' as any)
    .select('question_id, created_at')
    .eq('user_id', userId)
    .eq('topic', t)
    .eq('resolved', false)
    .order('created_at', { ascending: true })
    .limit(limit);
  return ((data ?? []) as any[]).map((r) => r.question_id as string);
}
