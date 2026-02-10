import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BetaAccessState {
  hasBetaAccess: boolean | null;
  loading: boolean;
}

export function useBetaAccess() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<BetaAccessState>({
    hasBetaAccess: null,
    loading: true,
  });

  useEffect(() => {
    const checkBetaAccess = async () => {
      if (!user) {
        setState({ hasBetaAccess: false, loading: false });
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_beta_access', {
          _user_id: user.id,
        });

        if (error) {
          console.error('Error checking beta access:', error);
          setState({ hasBetaAccess: false, loading: false });
          return;
        }

        setState({ hasBetaAccess: data as boolean, loading: false });
      } catch (err) {
        console.error('Error checking beta access:', err);
        setState({ hasBetaAccess: false, loading: false });
      }
    };

    if (!authLoading) {
      checkBetaAccess();
    }
  }, [user, authLoading]);

  const redeemInviteCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase.rpc('use_invite_code', {
        _code: code.toUpperCase().trim(),
        _user_id: user.id,
      });

      if (error) {
        console.error('Error redeeming invite code:', error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; message?: string; error?: string };
      
      if (result.success) {
        setState(prev => ({ ...prev, hasBetaAccess: true }));
        return { success: true };
      }

      return { success: false, error: result.error || 'Invalid invite code' };
    } catch (err) {
      console.error('Error redeeming invite code:', err);
      return { success: false, error: 'Failed to redeem code' };
    }
  }, [user]);

  return {
    ...state,
    redeemInviteCode,
    loading: authLoading || state.loading,
  };
}
