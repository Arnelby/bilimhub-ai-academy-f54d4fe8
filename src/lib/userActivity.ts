import { supabase } from '@/integrations/supabase/client';

/**
 * Deterministic motivation system. NO AI.
 * Backed by `user_activity` table + dynamic computation from `practice_sessions`.
 *
 * Rules:
 *  - Daily reset: when first action of day fires and last_active_date != today,
 *    `tasks_completed_today` resets to 0.
 *  - Streak rules:
 *      last_active_date == today      -> no change
 *      last_active_date == yesterday  -> streak += 1
 *      last_active_date < yesterday   -> streak  = 1
 *      last_active_date IS NULL       -> streak  = 1
 *  - Active days last 7: computed dynamically from DISTINCT
 *    DATE(practice_sessions.started_at) over the last 7 days.
 */

export const DEFAULT_DAILY_GOAL = 10;

export interface UserActivityRow {
  user_id: string;
  last_active_date: string | null; // YYYY-MM-DD
  streak: number;
  tasks_completed_today: number;
  daily_goal: number;
}

function todayISO(): string {
  const d = new Date();
  // local-date YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function diffDays(a: string, b: string): number {
  // a, b: YYYY-MM-DD ; returns a - b in days
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((da.getTime() - db.getTime()) / 86_400_000);
}

async function fetchOrCreate(userId: string): Promise<UserActivityRow> {
  const { data, error } = await supabase
    .from('user_activity' as any)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) console.error('[MOTIVATION] fetch failed', error);

  if (data) return data as unknown as UserActivityRow;

  const seed: UserActivityRow = {
    user_id: userId,
    last_active_date: null,
    streak: 0,
    tasks_completed_today: 0,
    daily_goal: DEFAULT_DAILY_GOAL,
  };
  const { error: insErr } = await supabase
    .from('user_activity' as any)
    .insert(seed);
  if (insErr) console.error('[MOTIVATION] seed insert failed', insErr);
  return seed;
}

/**
 * Daily check-in. Idempotent per day. Call on session start AND on first
 * answer — only the first call per local-day actually mutates.
 */
export async function checkInDaily(userId: string): Promise<UserActivityRow> {
  const row = await fetchOrCreate(userId);
  const today = todayISO();

  if (row.last_active_date === today) {
    console.log('[MOTIVATION_DEBUG]', {
      user_id: userId,
      streak: row.streak,
      tasks_completed_today: row.tasks_completed_today,
      action: 'noop_same_day',
    });
    return row;
  }

  let nextStreak: number;
  if (row.last_active_date && diffDays(today, row.last_active_date) === 1) {
    nextStreak = (row.streak || 0) + 1;
  } else {
    nextStreak = 1;
  }

  // Daily reset: tasks_completed_today resets to 0 because day rolled over.
  const next: Partial<UserActivityRow> = {
    last_active_date: today,
    streak: nextStreak,
    tasks_completed_today: 0,
  };

  const { error } = await supabase
    .from('user_activity' as any)
    .update(next)
    .eq('user_id', userId);
  if (error) console.error('[MOTIVATION] check-in update failed', error);

  const updated: UserActivityRow = { ...row, ...next } as UserActivityRow;
  console.log('[MOTIVATION_DEBUG]', {
    user_id: userId,
    streak: updated.streak,
    tasks_completed_today: updated.tasks_completed_today,
    action: 'daily_check_in',
  });
  return updated;
}

/**
 * Increment tasks_completed_today by 1. Always ensures the row exists and
 * the day is rolled-over before incrementing (idempotent guard).
 */
export async function incrementTaskCompleted(userId: string): Promise<UserActivityRow> {
  const row = await checkInDaily(userId);
  const next = (row.tasks_completed_today || 0) + 1;

  const { error } = await supabase
    .from('user_activity' as any)
    .update({ tasks_completed_today: next })
    .eq('user_id', userId);
  if (error) console.error('[MOTIVATION] increment failed', error);

  const updated: UserActivityRow = { ...row, tasks_completed_today: next };
  console.log('[MOTIVATION_DEBUG]', {
    user_id: userId,
    streak: updated.streak,
    tasks_completed_today: updated.tasks_completed_today,
    daily_goal: updated.daily_goal,
    goal_completed: updated.tasks_completed_today >= updated.daily_goal,
    action: 'task_increment',
  });
  return updated;
}

/**
 * Active days in the last 7 calendar days, computed dynamically from
 * practice_sessions.started_at — no parallel storage.
 */
export async function getActiveDaysLast7(userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('started_at')
    .eq('user_id', userId)
    .gte('started_at', since.toISOString());

  if (error) {
    console.error('[MOTIVATION] active-days query failed', error);
    return 0;
  }

  const set = new Set<string>();
  for (const r of data || []) {
    const s = (r as any).started_at;
    if (!s) continue;
    set.add(String(s).slice(0, 10));
  }
  return set.size;
}

export async function getUserActivity(userId: string): Promise<UserActivityRow> {
  return fetchOrCreate(userId);
}
