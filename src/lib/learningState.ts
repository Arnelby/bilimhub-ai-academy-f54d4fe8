import { supabase } from '@/integrations/supabase/client';
import { checkInDaily, DEFAULT_DAILY_GOAL } from '@/lib/userActivity';

/**
 * Learning State Engine — единый источник правды о том, что делать пользователю.
 * Детерминированно. БЕЗ AI.
 *
 * Состояние хранится в таблице `user_learning_state` и пересчитывается из:
 *  - user_tests              (был ли тест сегодня)
 *  - user_topic_stats        (слабые/сильные темы)
 *  - practice_responses      (ошибки за 2 дня)
 *  - user_activity           (streak, daily progress)
 *
 * ВСЕ модули обязаны вызывать `updateLearningState(userId)` после:
 *  - ответа на вопрос
 *  - завершения практики
 *  - завершения теста
 */

export type NextAction = 'test' | 'practice' | 'review_errors' | 'completed';
export type CurrentStep = 'test' | 'practice' | 'review' | 'done';

export interface LearningState {
  user_id: string;
  current_step: CurrentStep;
  weak_topics: string[];
  strong_topics: string[];
  current_topic: string | null;
  daily_goal: number;
  daily_progress: number;
  streak: number;
  last_activity_date: string | null;
  next_action: NextAction;
  next_reason: string;
  errors_count: number;
}

const MIN_ATTEMPTS_FOR_WEAK = 3;
const WEAK_THRESHOLD = 0.6;
const STRONG_THRESHOLD = 0.8;
const ERRORS_LOOKBACK_DAYS = 2;

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function lookbackISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ComputedSnapshot {
  testDoneToday: boolean;
  weak: Array<{ topic: string; accuracy: number }>;
  strong: string[];
  errorsCount: number;
  streak: number;
  dailyProgress: number;
  dailyGoal: number;
}

async function computeSnapshot(userId: string): Promise<ComputedSnapshot> {
  // Параллельно опрашиваем БД
  const [testsRes, statsRes, errorsRes, activityRow] = await Promise.all([
    supabase
      .from('user_tests')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', startOfTodayISO())
      .not('completed_at', 'is', null)
      .limit(1),
    supabase
      .from('user_topic_stats' as any)
      .select('topic, accuracy, total_attempts')
      .eq('user_id', userId),
    supabase
      .from('practice_responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_correct', false)
      .gte('created_at', lookbackISO(ERRORS_LOOKBACK_DAYS)),
    checkInDaily(userId).catch(() => null),
  ]);

  const testDoneToday = (testsRes.data?.length ?? 0) > 0;

  const rows = (statsRes.data ?? []) as unknown as Array<{
    topic: string;
    accuracy: number;
    total_attempts: number;
  }>;

  const weak = rows
    .filter(
      (r) =>
        (r.total_attempts ?? 0) >= MIN_ATTEMPTS_FOR_WEAK &&
        (r.accuracy ?? 0) < WEAK_THRESHOLD,
    )
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
    .map((r) => ({ topic: r.topic, accuracy: r.accuracy ?? 0 }));

  const strong = rows
    .filter(
      (r) =>
        (r.total_attempts ?? 0) >= MIN_ATTEMPTS_FOR_WEAK &&
        (r.accuracy ?? 0) >= STRONG_THRESHOLD,
    )
    .map((r) => r.topic);

  const errorsCount = errorsRes.count ?? 0;

  return {
    testDoneToday,
    weak,
    strong,
    errorsCount,
    streak: activityRow?.streak ?? 0,
    dailyProgress: activityRow?.tasks_completed_today ?? 0,
    dailyGoal: activityRow?.daily_goal ?? DEFAULT_DAILY_GOAL,
  };
}

function resolveNext(snap: ComputedSnapshot): {
  next_action: NextAction;
  current_step: CurrentStep;
  current_topic: string | null;
  reason: string;
} {
  // Дневной flow: test → practice → review_errors → completed
  if (!snap.testDoneToday) {
    return {
      next_action: 'test',
      current_step: 'test',
      current_topic: null,
      reason: 'Сегодня ты ещё не проходил тест',
    };
  }

  if (snap.weak.length > 0 && snap.dailyProgress < snap.dailyGoal) {
    const top = snap.weak[0];
    const pct = Math.round((top.accuracy ?? 0) * 100);
    return {
      next_action: 'practice',
      current_step: 'practice',
      current_topic: top.topic,
      reason: `Ты тренируешь тему «${top.topic}» (точность ${pct}%)`,
    };
  }

  if (snap.errorsCount > 0) {
    const word =
      snap.errorsCount === 1
        ? 'ошибка'
        : snap.errorsCount < 5
          ? 'ошибки'
          : 'ошибок';
    return {
      next_action: 'review_errors',
      current_step: 'review',
      current_topic: null,
      reason: `У тебя ${snap.errorsCount} ${word} — нужно закрепить`,
    };
  }

  if (snap.dailyProgress < snap.dailyGoal) {
    return {
      next_action: 'practice',
      current_step: 'practice',
      current_topic: null,
      reason: 'Выполни дневную норму практики',
    };
  }

  return {
    next_action: 'completed',
    current_step: 'done',
    current_topic: null,
    reason: 'Все задачи на сегодня выполнены — отличная работа!',
  };
}

/**
 * Пересчитать состояние пользователя и записать в БД.
 * Возвращает свежее состояние. Идемпотентна.
 */
export async function updateLearningState(userId: string): Promise<LearningState | null> {
  if (!userId) return null;

  try {
    const snap = await computeSnapshot(userId);
    const next = resolveNext(snap);

    const payload = {
      user_id: userId,
      current_step: next.current_step,
      weak_topics: snap.weak.map((w) => w.topic),
      strong_topics: snap.strong,
      current_topic: next.current_topic,
      daily_goal: snap.dailyGoal,
      daily_progress: snap.dailyProgress,
      streak: snap.streak,
      last_activity_date: todayDate(),
      next_action: next.next_action,
      next_reason: next.reason,
      errors_count: snap.errorsCount,
    };

    const { data, error } = await supabase
      .from('user_learning_state' as any)
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[LEARNING_STATE] upsert failed', error);
      return null;
    }

    console.log('[LEARNING_STATE]', {
      user_id: userId,
      next_action: payload.next_action,
      current_topic: payload.current_topic,
      weak_count: payload.weak_topics.length,
      errors: payload.errors_count,
      progress: `${payload.daily_progress}/${payload.daily_goal}`,
    });

    return data as unknown as LearningState;
  } catch (e) {
    console.error('[LEARNING_STATE] update failed', e);
    return null;
  }
}

/**
 * Получить кэшированное состояние. Если его нет — пересчитать.
 */
export async function getLearningState(userId: string): Promise<LearningState | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_learning_state' as any)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[LEARNING_STATE] fetch failed', error);
  }

  if (data) {
    return data as unknown as LearningState;
  }

  // Первое обращение — рассчитать и записать
  return updateLearningState(userId);
}

export function nextActionLabel(a: NextAction): string {
  switch (a) {
    case 'test':
      return 'тест';
    case 'practice':
      return 'практика';
    case 'review_errors':
      return 'повтор ошибок';
    case 'completed':
      return 'завершено';
  }
}

export function nextActionRoute(state: LearningState): string {
  switch (state.next_action) {
    case 'test':
      return '/tests';
    case 'practice':
      return state.current_topic
        ? `/practice?topic=${encodeURIComponent(state.current_topic)}`
        : '/practice';
    case 'review_errors':
      return '/practice?mode=review';
    case 'completed':
      return '/dashboard';
  }
}
