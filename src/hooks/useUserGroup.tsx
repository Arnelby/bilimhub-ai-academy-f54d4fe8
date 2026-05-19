import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type ExperimentGroup = 'ai' | 'control' | 'showcase';

interface UserGroupState {
  group: ExperimentGroup | null;
  loading: boolean;
}

// Module-level cache: group rarely changes during a session.
const groupCache = new Map<string, ExperimentGroup>();
const groupInflight = new Map<string, Promise<ExperimentGroup>>();

async function fetchGroupOnce(userId: string, email: string): Promise<ExperimentGroup> {
  const cached = groupCache.get(userId);
  if (cached) return cached;
  const existing = groupInflight.get(userId);
  if (existing) return existing;

  const p = (async () => {
    try {
      const { data: whitelistEntry } = await supabase
        .from('beta_whitelist')
        .select('group_type')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (whitelistEntry?.group_type) {
        const g = whitelistEntry.group_type as ExperimentGroup;
        groupCache.set(userId, g);
        groupInflight.delete(userId);
        return g;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('group_type')
        .eq('id', userId)
        .maybeSingle();

      const g = ((profile?.group_type as ExperimentGroup) || 'ai');
      groupCache.set(userId, g);
      groupInflight.delete(userId);
      return g;
    } catch (err) {
      console.error('Error fetching user group:', err);
      groupInflight.delete(userId);
      return 'ai' as ExperimentGroup;
    }
  })();

  groupInflight.set(userId, p);
  return p;
}

export function useUserGroup() {
  const { user, loading: authLoading } = useAuth();
  const initial = user ? groupCache.get(user.id) ?? null : null;
  const [state, setState] = useState<UserGroupState>({
    group: initial,
    loading: initial === null,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ group: null, loading: false });
      return;
    }
    const cached = groupCache.get(user.id);
    if (cached) {
      setState({ group: cached, loading: false });
      return;
    }
    let cancelled = false;
    fetchGroupOnce(user.id, user.email || '').then((g) => {
      if (!cancelled) setState({ group: g, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const isAI = state.group === 'ai';
  const isControl = state.group === 'control';
  const isShowcase = state.group === 'showcase';

  return {
    ...state,
    isAI,
    isControl,
    isShowcase,
    canAccessAI: isAI,
    canAccessLessons: isAI || isControl,
    canAccessDashboard: isAI || isControl,
    canAccessTests: isAI || isControl || isShowcase,
    canAccessProfile: isAI || isControl || isShowcase,
    canAccessPractice: isAI || isControl,
  };
}
