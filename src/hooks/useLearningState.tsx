import { useCallback, useEffect, useState } from 'react';
import {
  getLearningState,
  updateLearningState,
  type LearningState,
} from '@/lib/learningState';

/**
 * React hook for the unified Learning State Engine.
 * Auto-loads on mount; expose `refresh()` to recompute after actions.
 */
export function useLearningState(userId: string | undefined) {
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const s = await getLearningState(userId);
    setState(s);
    setLoading(false);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const s = await updateLearningState(userId);
    if (s) setState(s);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, loading, refresh };
}
