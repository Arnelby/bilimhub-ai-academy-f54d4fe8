import { supabase } from '@/integrations/supabase/client';
import { normalizeAnalyticsTopic } from '@/lib/topicTranslations';

/**
 * Deterministic per-topic stats (NO AI).
 *
 * Table: user_topic_stats (unique on user_id, topic)
 * Updated after every practice answer.
 */

const MIN_ATTEMPTS_FOR_WEAK = 5;
const WEAK_ACCURACY_THRESHOLD = 0.6;
const STRONG_ACCURACY_THRESHOLD = 0.8;
const MIN_ATTEMPTS_FOR_STRONG = 3;

export interface WeakTopicRow {
  topic: string;
  accuracy: number;       // 0..1
  total_attempts: number;
  correct_answers: number;
}

export interface WeakTopicsResult {
  topics: WeakTopicRow[];
  insufficient_data: boolean;
}

/**
 * Increment per-topic stats for a single answer.
 * Read-modify-write inside one call; unique constraint (user_id, topic) prevents duplicates.
 */
export async function updateTopicStats(params: {
  userId: string;
  topic: string | null | undefined;
  isCorrect: boolean;
}): Promise<void> {
  const { userId, isCorrect } = params;
  const topic = normalizeAnalyticsTopic(params.topic || '');
  if (!userId || !topic) return;

  const { data: existing, error: selErr } = await supabase
    .from('user_topic_stats' as any)
    .select('id, total_attempts, correct_answers')
    .eq('user_id', userId)
    .eq('topic', topic)
    .maybeSingle();

  if (selErr) {
    console.error('[TOPIC_UPDATE] select failed', selErr);
    return;
  }

  if (!existing) {
    const total = 1;
    const correct = isCorrect ? 1 : 0;
    const accuracy = correct / total;
    const { error } = await supabase.from('user_topic_stats' as any).insert({
      user_id: userId,
      topic,
      total_attempts: total,
      correct_answers: correct,
      accuracy,
    });
    if (error) {
      // Possibly a race — retry once as update
      console.warn('[TOPIC_UPDATE] insert failed, retrying as update', error);
      await updateTopicStats(params);
      return;
    }
    console.log('[TOPIC_UPDATE]', {
      user_id: userId,
      topic,
      total_attempts: total,
      correct_answers: correct,
      accuracy,
    });
    return;
  }

  const row = existing as unknown as { id: string; total_attempts: number; correct_answers: number };
  const total = (row.total_attempts ?? 0) + 1;
  const correct = (row.correct_answers ?? 0) + (isCorrect ? 1 : 0);
  const accuracy = total > 0 ? correct / total : 0;

  const { error } = await supabase
    .from('user_topic_stats' as any)
    .update({
      total_attempts: total,
      correct_answers: correct,
      accuracy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (error) {
    console.error('[TOPIC_UPDATE] update failed', error);
    return;
  }

  console.log('[TOPIC_UPDATE]', {
    user_id: userId,
    topic,
    total_attempts: total,
    correct_answers: correct,
    accuracy,
  });
}

/**
 * Returns weak topics (accuracy < 0.6, attempts >= 5), sorted by accuracy ASC.
 * If no topic has enough attempts, returns top 3 with the lowest attempts and
 * `insufficient_data: true`.
 */
export async function getWeakTopics(userId: string): Promise<WeakTopicsResult> {
  if (!userId) return { topics: [], insufficient_data: true };

  const { data, error } = await supabase
    .from('user_topic_stats' as any)
    .select('topic, accuracy, total_attempts, correct_answers')
    .eq('user_id', userId);

  if (error) {
    console.error('[WEAK_TOPICS] fetch failed', error);
    return { topics: [], insufficient_data: true };
  }

  const rows = (data ?? []) as unknown as WeakTopicRow[];

  const reliable = rows.filter(
    (r) => (r.total_attempts ?? 0) >= MIN_ATTEMPTS_FOR_WEAK && (r.accuracy ?? 0) < WEAK_ACCURACY_THRESHOLD
  );

  if (reliable.length > 0) {
    reliable.sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
    console.log('[WEAK_TOPICS]', { user_id: userId, topics_list: reliable.map((r) => r.topic) });
    return { topics: reliable, insufficient_data: false };
  }

  // Insufficient data: surface up to 3 topics with the lowest attempt counts
  const fallback = [...rows]
    .sort((a, b) => (a.total_attempts ?? 0) - (b.total_attempts ?? 0))
    .slice(0, 3);
  console.log('[WEAK_TOPICS]', {
    user_id: userId,
    topics_list: fallback.map((r) => r.topic),
    insufficient_data: true,
  });
  return { topics: fallback, insufficient_data: true };
}
