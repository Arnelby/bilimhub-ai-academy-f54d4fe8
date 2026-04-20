import { useCallback, useEffect, useState } from 'react';
import {
  getLearningState,
  updateLearningState,
  type LearningState,
} from '@/lib/learningState';

/**
 * React hook for the unified Learning State Engine.
 *
 * On mount: ALWAYS recomputes (updateLearningState) so the next_action
 * reflects the latest practice / lesson / test events — never a stale row.
 * Also re-syncs on window focus and tab visibility change so returning
 * to the Home tab after a practice session shows the fresh recommendation.
 */
export function useLearningState(userId: string | undefined) {
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (recompute: boolean) => {
    if (!userId) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const s = recompute
      ? await updateLearningState(userId)
      : await getLearningState(userId);
    setState(s);
    setLoading(false);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const s = await updateLearningState(userId);
    if (s) setState(s);
  }, [userId]);

  // Initial mount → force recompute (cheap, deterministic, no AI).
  useEffect(() => {
    void load(true);
  }, [load]);

  // Re-sync on focus / visibilitychange so navigation between tabs
  // (Practice → Главная) always shows the latest next_action.
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => { void refresh(); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, refresh]);

  return { state, loading, refresh };
}
