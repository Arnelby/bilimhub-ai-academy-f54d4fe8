import { supabase } from '@/integrations/supabase/client';
import { topicToLessonSlug } from '@/lib/topicTranslations';

/**
 * Mastery Loop — детерминированная машина состояний:
 *   idle → lesson → practice (5 задач, 2 подряд верно) → validation (5, ≥80%) → idle
 *   Любая ошибка в practice → откат в lesson.
 *   Провал validation → откат в lesson.
 *   Успех validation → idle (recompute_learning_state выберет следующую weak_topic).
 *
 * AI В РАНТАЙМЕ ЗАПРЕЩЁН. Вся логика — в SQL функциях:
 *   recompute_learning_state, advance_mastery_phase, complete_mastery_lesson.
 */

export type MasteryPhase = 'idle' | 'lesson' | 'practice' | 'validation';

export interface MasteryLoopState {
  mastery_phase: MasteryPhase;
  phase_topic: string | null;
  phase_correct_streak: number;
  phase_attempts: Array<{ correct: boolean; ts: string }>;
  weak_topics: string[];
  strong_topics: string[];
  next_action: string;
  next_reason: string | null;
  topic_stats: Record<string, { total_attempts: number; correct_answers: number; accuracy: number }>;
}

/**
 * Recompute everything from raw responses. Cheap, deterministic, no AI.
 * Returns the updated mastery slice.
 */
export async function recomputeMasteryState(userId: string): Promise<void> {
  if (!userId) return;
  const { error } = await supabase.rpc('recompute_learning_state' as any, {
    _user_id: userId,
  });
  if (error) {
    console.error('[MASTERY_RECOMPUTE_FAIL]', error);
  }
}

/**
 * Called after EVERY answer in practice/validation phase.
 * SQL function decides phase transition.
 */
export async function advanceMasteryAfterAnswer(params: {
  userId: string;
  topic: string;
  isCorrect: boolean;
  isValidation: boolean;
}): Promise<{ old_phase: MasteryPhase; new_phase: MasteryPhase; new_topic: string | null } | null> {
  const { userId, topic, isCorrect, isValidation } = params;
  console.log('[LEARNING_STEP]', { user_id: userId, topic, isCorrect, isValidation });

  const { data, error } = await supabase.rpc('advance_mastery_phase' as any, {
    _user_id: userId,
    _topic: topic,
    _is_correct: isCorrect,
    _is_validation: isValidation,
  });
  if (error) {
    console.error('[MASTERY_ADVANCE_FAIL]', error);
    return null;
  }
  const result = data as any;
  if (result?.changed) {
    console.log('[MASTERY_CHECK]', {
      topic,
      old_phase: result.old_phase,
      new_phase: result.new_phase,
      streak: result.streak,
    });
  }
  return result;
}

/**
 * User clicked "I watched the lesson" → move to practice phase.
 */
export async function completeMasteryLesson(userId: string, topic: string): Promise<void> {
  console.log('[LEARNING_STEP]', { user_id: userId, step: 'lesson_completed', topic });
  const { error } = await supabase.rpc('complete_mastery_lesson' as any, {
    _user_id: userId,
    _topic: topic,
  });
  if (error) console.error('[MASTERY_LESSON_COMPLETE_FAIL]', error);
}

/**
 * Read raw mastery slice from user_learning_state.
 */
export async function getMasteryLoopState(userId: string): Promise<MasteryLoopState | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_learning_state' as any)
    .select(
      'mastery_phase, phase_topic, phase_correct_streak, phase_attempts, weak_topics, strong_topics, next_action, next_reason, topic_stats',
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[MASTERY_FETCH_FAIL]', error);
    return null;
  }
  if (!data) return null;
  const row = data as any;
  return {
    mastery_phase: (row.mastery_phase || 'idle') as MasteryPhase,
    phase_topic: row.phase_topic ?? null,
    phase_correct_streak: row.phase_correct_streak ?? 0,
    phase_attempts: Array.isArray(row.phase_attempts) ? row.phase_attempts : [],
    weak_topics: Array.isArray(row.weak_topics) ? row.weak_topics : [],
    strong_topics: Array.isArray(row.strong_topics) ? row.strong_topics : [],
    next_action: row.next_action || 'idle',
    next_reason: row.next_reason ?? null,
    topic_stats: (row.topic_stats || {}) as any,
  };
}

/**
 * Resolve the route for the current mastery phase.
 * Used by NextStep / home CTA.
 */
export function masteryPhaseRoute(state: MasteryLoopState): { route: string; label: string; icon: 'lesson' | 'practice' | 'validation' | 'done' } {
  const t = state.phase_topic;
  const slug = topicToLessonSlug(t);
  switch (state.mastery_phase) {
    case 'lesson':
      return {
        // Prefer DynamicLessonViewer (slug). Fallback to filtered lessons list.
        route: slug ? `/lessons/topic/${encodeURIComponent(slug)}` : (t ? `/lessons?topic=${encodeURIComponent(t)}` : '/lessons'),
        label: 'Смотреть урок',
        icon: 'lesson',
      };
    case 'practice':
      return {
        route: t ? `/practice?topic=${encodeURIComponent(t)}&mode=mastery` : '/practice',
        label: 'Практика темы',
        icon: 'practice',
      };
    case 'validation':
      return {
        route: t ? `/practice?topic=${encodeURIComponent(t)}&mode=validation` : '/practice',
        label: 'Проверка темы',
        icon: 'validation',
      };
    case 'idle':
    default:
      return { route: '/dashboard', label: 'Открыть прогресс', icon: 'done' };
  }
}
