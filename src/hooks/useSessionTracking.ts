import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks user sessions in user_sessions table.
 * Creates a session on mount, updates duration on unmount / visibility change.
 */
export function useSessionTracking(userId: string | undefined) {
  const sessionIdRef = useRef<string | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    async function startSession() {
      try {
        const { data, error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: userId,
            session_start: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          console.error('[SESSION] Failed to create session:', error.message);
          return;
        }
        if (mounted && data) {
          sessionIdRef.current = data.id;
          startRef.current = Date.now();
        }
      } catch (err) {
        console.error('[SESSION] Error:', err);
      }
    }

    async function endSession() {
      const sid = sessionIdRef.current;
      if (!sid) return;

      const duration = Math.round((Date.now() - startRef.current) / 1000);
      try {
        await supabase
          .from('user_sessions')
          .update({
            session_end: new Date().toISOString(),
            duration_seconds: duration,
          })
          .eq('id', sid);
      } catch (err) {
        console.error('[SESSION] End error:', err);
      }
      sessionIdRef.current = null;
    }

    // Update last_activity_date on profile
    async function updateActivity() {
      try {
        await supabase
          .from('profiles')
          .update({ last_activity_date: new Date().toISOString().split('T')[0] })
          .eq('id', userId);
      } catch {}
    }

    startSession();
    updateActivity();

    // Periodic heartbeat to keep duration updated (every 30s)
    const heartbeat = setInterval(async () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      try {
        await supabase
          .from('user_sessions')
          .update({
            session_end: new Date().toISOString(),
            duration_seconds: duration,
          })
          .eq('id', sid);
      } catch {}
    }, 30000);

    // End session on tab close / hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      } else if (document.visibilityState === 'visible' && !sessionIdRef.current) {
        startSession();
        startRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      endSession();
    };
  }, [userId]);
}
