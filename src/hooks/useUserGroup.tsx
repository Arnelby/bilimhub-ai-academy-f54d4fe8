import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type ExperimentGroup = 'ai' | 'control' | 'showcase';

interface UserGroupState {
  group: ExperimentGroup | null;
  loading: boolean;
}

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

  const isAI = state.group === 'ai';
  const isControl = state.group === 'control';
  const isShowcase = state.group === 'showcase';

  // UPDATED access rules per experiment spec:
  // ai = full access
  // control = tests + lessons + basic dashboard + profile (NO AI, NO plan, NO practice, NO personalization)
  // showcase = tests + profile + home only
  const canAccessAI = isAI;
  const canAccessLessons = isAI || isControl; // control gets lessons
  const canAccessDashboard = isAI || isControl; // control gets basic dashboard
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
