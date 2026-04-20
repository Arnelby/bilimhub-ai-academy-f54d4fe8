import { supabase } from '@/integrations/supabase/client';

/**
 * Next Step Engine — deterministic, NO AI.
 * Returns ONE next action for the user. No choices.
 */

export type NextAction = 'test' | 'practice' | 'review_errors' | 'completed';

export interface NextStepResult {
  next_action: NextAction;
  reason: string;
  // Optional context for redirect/UI
  weak_topic?: string;
  weak_accuracy?: number;
  errors_count?: number;
  step_index: number; // 1..3 within today's flow
  total_steps: number; // always 3
  upcoming: NextAction[]; // remaining actions after current
}

const MIN_ATTEMPTS_FOR_WEAK = 5;
const WEAK_ACCURACY_THRESHOLD = 0.6;

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function twoDaysAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Deterministic next-action resolver.
 * Order: test -> practice (weak topic) -> review_errors -> completed.
 */
export async function getNextAction(userId: string): Promise<NextStepResult> {
  const fallback: NextStepResult = {
    next_action: 'test',
    reason: 'Начни с диагностического теста',
    step_index: 1,
    total_steps: 3,
    upcoming: ['practice', 'review_errors'],
  };
  if (!userId) return fallback;

  // 1. Test today?
  let testDoneToday = false;
  try {
    const { data: tests } = await supabase
      .from('user_tests')
      .select('id, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', startOfTodayISO())
      .not('completed_at', 'is', null)
      .limit(1);
    testDoneToday = (tests?.length ?? 0) > 0;
  } catch (e) {
    console.error('[NEXT_STEP] tests query failed', e);
  }

  if (!testDoneToday) {
    const result: NextStepResult = {
      next_action: 'test',
      reason: 'Сегодня ты ещё не проходил тест',
      step_index: 1,
      total_steps: 3,
      upcoming: ['practice', 'review_errors'],
    };
    console.log('[NEXT_STEP_DEBUG]', { user_id: userId, next_action: result.next_action, reason: result.reason });
    return result;
  }

  // 2. Weak topic? accuracy < 60% AND attempts >= 5
  let weakTopic: { topic: string; accuracy: number } | null = null;
  try {
    const { data: stats } = await supabase
      .from('user_topic_stats' as any)
      .select('topic, accuracy, total_attempts')
      .eq('user_id', userId);
    const rows = (stats ?? []) as unknown as Array<{ topic: string; accuracy: number; total_attempts: number }>;
    const weak = rows
      .filter((r) => (r.total_attempts ?? 0) >= MIN_ATTEMPTS_FOR_WEAK && (r.accuracy ?? 0) < WEAK_ACCURACY_THRESHOLD)
      .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
    if (weak.length > 0) {
      weakTopic = { topic: weak[0].topic, accuracy: weak[0].accuracy };
    }
  } catch (e) {
    console.error('[NEXT_STEP] topic stats query failed', e);
  }

  if (weakTopic) {
    const pct = Math.round((weakTopic.accuracy ?? 0) * 100);
    const result: NextStepResult = {
      next_action: 'practice',
      reason: `Ты тренируешь тему «${weakTopic.topic}» (точность ${pct}%)`,
      weak_topic: weakTopic.topic,
      weak_accuracy: weakTopic.accuracy,
      step_index: 2,
      total_steps: 3,
      upcoming: ['review_errors'],
    };
    console.log('[NEXT_STEP_DEBUG]', { user_id: userId, next_action: result.next_action, reason: result.reason });
    return result;
  }

  // 3. Errors in last 2 days?
  let errorsCount = 0;
  try {
    const { count } = await supabase
      .from('practice_responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_correct', false)
      .gte('created_at', twoDaysAgoISO());
    errorsCount = count ?? 0;
  } catch (e) {
    console.error('[NEXT_STEP] errors query failed', e);
  }

  if (errorsCount > 0) {
    const result: NextStepResult = {
      next_action: 'review_errors',
      reason: `У тебя ${errorsCount} ошиб${errorsCount === 1 ? 'ка' : errorsCount < 5 ? 'ки' : 'ок'} — нужно закрепить`,
      errors_count: errorsCount,
      step_index: 3,
      total_steps: 3,
      upcoming: [],
    };
    console.log('[NEXT_STEP_DEBUG]', { user_id: userId, next_action: result.next_action, reason: result.reason });
    return result;
  }

  // 4. All done
  const result: NextStepResult = {
    next_action: 'completed',
    reason: 'Все задачи на сегодня выполнены — отличная работа!',
    step_index: 3,
    total_steps: 3,
    upcoming: [],
  };
  console.log('[NEXT_STEP_DEBUG]', { user_id: userId, next_action: result.next_action, reason: result.reason });
  return result;
}

export function nextActionLabel(a: NextAction): string {
  switch (a) {
    case 'test': return 'тест';
    case 'practice': return 'практика';
    case 'review_errors': return 'повтор ошибок';
    case 'completed': return 'завершено';
  }
}
