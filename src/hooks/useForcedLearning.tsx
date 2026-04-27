import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchOpenSession,
  startOrResumeSession,
  pauseSession as rpcPause,
  completeSession as rpcComplete,
  type LearningSession,
} from '@/lib/forcedLearning';

interface ForcedLearningContextValue {
  session: LearningSession | null;
  loading: boolean;
  isLocked: boolean; // true when an active session forces the /learn route
  refresh: () => Promise<LearningSession | null>;
  start: (topic?: string | null) => Promise<LearningSession | null>;
  pause: () => Promise<void>;
  complete: () => Promise<void>;
  setSession: (s: LearningSession | null) => void;
}

const Ctx = createContext<ForcedLearningContextValue | null>(null);

export function ForcedLearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setSession(null);
      setLoading(false);
      return null;
    }
    if (inflight.current) return session;
    inflight.current = true;
    try {
      const s = await fetchOpenSession();
      setSession(s);
      return s;
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [user?.id, session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const start = useCallback(async (topic?: string | null) => {
    const s = await startOrResumeSession(topic ?? null);
    setSession(s);
    return s;
  }, []);

  const pause = useCallback(async () => {
    await rpcPause();
    await refresh();
  }, [refresh]);

  const complete = useCallback(async () => {
    await rpcComplete();
    setSession(null);
  }, []);

  const value = useMemo<ForcedLearningContextValue>(() => ({
    session,
    loading,
    isLocked: !!session && session.status === 'active',
    refresh,
    start,
    pause,
    complete,
    setSession,
  }), [session, loading, refresh, start, pause, complete]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useForcedLearning(): ForcedLearningContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useForcedLearning must be used within ForcedLearningProvider');
  return v;
}
