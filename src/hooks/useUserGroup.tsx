import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type ExperimentGroup = 'ai' | 'control' | 'showcase';

interface UserGroupState {
  group: ExperimentGroup | null;
  loading: boolean;
}

/**
 * Fetches the user's experiment group from beta_whitelist (source of truth).
 * Falls back to profiles.group_type if not in whitelist.
 * Default: 'ai' if nothing found.
 */
export function useUserGroup() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<UserGroupState>({ group: null, loading: true });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ group: null, loading: false });
      return;
    }

    async function fetchGroup() {
      try {
        // 1. Check beta_whitelist first (source of truth)
        const { data: whitelistEntry } = await supabase
          .from('beta_whitelist')
          .select('group_type')
          .eq('email', user!.email?.toLowerCase() || '')
          .eq('is_active', true)
          .maybeSingle();

        if (whitelistEntry?.group_type) {
          setState({ group: whitelistEntry.group_type as ExperimentGroup, loading: false });
          return;
        }

        // 2. Fallback to profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('group_type')
          .eq('id', user!.id)
          .maybeSingle();

        setState({
          group: (profile?.group_type as ExperimentGroup) || 'ai',
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching user group:', err);
        setState({ group: 'ai', loading: false });
      }
    }

    fetchGroup();
  }, [user, authLoading]);

  // Convenience booleans
  const isAI = state.group === 'ai';
  const isControl = state.group === 'control';
  const isShowcase = state.group === 'showcase';

  // Route access helpers
  const canAccessAI = isAI; // AI tutor, practice, learning plan
  const canAccessLessons = isAI; // full lessons
  const canAccessDashboard = isAI; // analytics dashboard
  const canAccessTests = isAI || isControl || isShowcase;
  const canAccessProfile = isAI || isControl || isShowcase;

  return {
    ...state,
    isAI,
    isControl,
    isShowcase,
    canAccessAI,
    canAccessLessons,
    canAccessDashboard,
    canAccessTests,
    canAccessProfile,
  };
}
