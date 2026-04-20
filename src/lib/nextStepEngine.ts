import { getLearningState, type LearningState } from '@/lib/learningState';

/**
 * THIN WRAPPER — kept for backward compatibility.
 * The single source of truth is `user_learning_state`.
 * This module no longer computes anything; it just reads from state.
 */

export type NextAction = 'test' | 'practice' | 'review_errors' | 'completed';

export interface NextStepResult {
  next_action: NextAction;
  reason: string;
  weak_topic?: string;
  weak_accuracy?: number;
  errors_count?: number;
  step_index: number;
  total_steps: number;
  upcoming: NextAction[];
}

const STEP_INDEX: Record<NextAction, number> = {
  test: 1,
  practice: 2,
  review_errors: 3,
  completed: 3,
};

const UPCOMING: Record<NextAction, NextAction[]> = {
  test: ['practice', 'review_errors'],
  practice: ['review_errors'],
  review_errors: [],
  completed: [],
};

export async function getNextAction(userId: string): Promise<NextStepResult> {
  const fallback: NextStepResult = {
    next_action: 'test',
    reason: 'Начни с диагностического теста',
    step_index: 1,
    total_steps: 3,
    upcoming: ['practice', 'review_errors'],
  };
  if (!userId) return fallback;

  const state: LearningState | null = await getLearningState(userId);
  if (!state) return fallback;

  const action = state.next_action ?? 'test';
  const result: NextStepResult = {
    next_action: action,
    reason: state.next_reason || fallback.reason,
    weak_topic: state.current_topic ?? undefined,
    errors_count: state.errors_count,
    step_index: STEP_INDEX[action],
    total_steps: 3,
    upcoming: UPCOMING[action],
  };
  console.log('[NEXT_ACTION]', { user_id: userId, next_action: result.next_action, reason: result.reason });
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
