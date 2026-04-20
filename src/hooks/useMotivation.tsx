import { useCallback, useEffect, useState } from 'react';
import {
  checkInDaily,
  getActiveDaysLast7,
  getUserActivity,
  incrementTaskCompleted,
  DEFAULT_DAILY_GOAL,
  type UserActivityRow,
} from '@/lib/userActivity';

interface State {
  loading: boolean;
  streak: number;
  tasksCompletedToday: number;
  dailyGoal: number;
  goalCompleted: boolean;
  lastActiveDate: string | null;
  activeDaysLast7: number;
  warningLevel: 'none' | 'soft' | 'strong' | 'risk';
}

const initial: State = {
  loading: true,
  streak: 0,
  tasksCompletedToday: 0,
  dailyGoal: DEFAULT_DAILY_GOAL,
  goalCompleted: false,
  lastActiveDate: null,
  activeDaysLast7: 0,
  warningLevel: 'none',
};

function deriveWarning(active7: number, lastActive: string | null): State['warningLevel'] {
  // "Risk of losing streak" — last active was more than 2 days ago.
  if (lastActive) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = new Date(lastActive + 'T00:00:00');
    const days = Math.round((today.getTime() - last.getTime()) / 86_400_000);
    if (days > 2) return 'risk';
  }
  if (active7 < 2) return 'strong';
  if (active7 < 3) return 'soft';
  return 'none';
}

function applyRow(row: UserActivityRow, active7: number): State {
  return {
    loading: false,
    streak: row.streak || 0,
    tasksCompletedToday: row.tasks_completed_today || 0,
    dailyGoal: row.daily_goal || DEFAULT_DAILY_GOAL,
    goalCompleted: (row.tasks_completed_today || 0) >= (row.daily_goal || DEFAULT_DAILY_GOAL),
    lastActiveDate: row.last_active_date,
    activeDaysLast7: active7,
    warningLevel: deriveWarning(active7, row.last_active_date),
  };
}

export function useMotivation(userId: string | undefined) {
  const [state, setState] = useState<State>(initial);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [row, active7] = await Promise.all([
      getUserActivity(userId),
      getActiveDaysLast7(userId),
    ]);
    setState(applyRow(row, active7));
  }, [userId]);

  /** Call on session start. Idempotent per day. */
  const checkIn = useCallback(async () => {
    if (!userId) return;
    const row = await checkInDaily(userId);
    const active7 = await getActiveDaysLast7(userId);
    setState(applyRow(row, active7));
  }, [userId]);

  /** Call after each successfully-saved practice answer. */
  const recordTask = useCallback(async () => {
    if (!userId) return;
    const row = await incrementTaskCompleted(userId);
    setState(prev => ({
      ...prev,
      loading: false,
      streak: row.streak || 0,
      tasksCompletedToday: row.tasks_completed_today || 0,
      dailyGoal: row.daily_goal || DEFAULT_DAILY_GOAL,
      goalCompleted: (row.tasks_completed_today || 0) >= (row.daily_goal || DEFAULT_DAILY_GOAL),
      lastActiveDate: row.last_active_date,
    }));
  }, [userId]);

  useEffect(() => {
    if (userId) void refresh();
  }, [userId, refresh]);

  return { ...state, checkIn, recordTask, refresh };
}
