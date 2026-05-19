import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FullNameModal } from '@/components/onboarding/FullNameModal';
import { useUserGroup } from '@/hooks/useUserGroup';
// NOTE: useSessionTracking is intentionally NOT used here — it is mounted
// once at the app root via <SessionTrackingRoot /> to avoid creating a new
// user_sessions row on every navigation between protected pages.

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipDiagnosticCheck?: boolean;
  requireAI?: boolean;
}

// Module-level cache so navigation between protected routes does NOT
// re-run profile/diagnostic checks (which previously caused a full-page
// loader on every page change).
interface AccessCacheEntry {
  hasName: boolean;
  diagnosticCompleted: boolean;
}
const accessCache = new Map<string, AccessCacheEntry>();
const inflight = new Map<string, Promise<AccessCacheEntry>>();

async function loadAccess(userId: string): Promise<AccessCacheEntry> {
  const cached = accessCache.get(userId);
  if (cached) return cached;
  const existing = inflight.get(userId);
  if (existing) return existing;

  const p = (async () => {
    const [{ data: profile }, { data: diagProfile }] = await Promise.all([
      supabase.from('profiles').select('full_name, name').eq('id', userId).maybeSingle(),
      supabase
        .from('user_diagnostic_profile')
        .select('diagnostic_completed')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    let diagnosticCompleted = !!diagProfile?.diagnostic_completed;
    if (!diagnosticCompleted) {
      const { data: testData } = await supabase
        .from('user_tests')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .limit(1)
        .maybeSingle();
      diagnosticCompleted = !!testData;
    }

    const entry: AccessCacheEntry = {
      hasName: !!(profile?.full_name || profile?.name),
      diagnosticCompleted,
    };
    accessCache.set(userId, entry);
    inflight.delete(userId);
    return entry;
  })();

  inflight.set(userId, p);
  return p;
}

export function invalidateAccessCache(userId?: string) {
  if (userId) accessCache.delete(userId);
  else accessCache.clear();
}

export function ProtectedRoute({ children, skipDiagnosticCheck = false, requireAI = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { group, loading: groupLoading, canAccessAI } = useUserGroup();
  const location = useLocation();

  const cached = user ? accessCache.get(user.id) : undefined;
  const [access, setAccess] = useState<AccessCacheEntry | null>(cached ?? null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setAccess(null);
      return;
    }
    const c = accessCache.get(user.id);
    if (c) {
      setAccess(c);
      return;
    }
    loadAccess(user.id).then((entry) => {
      if (!cancelled) setAccess(entry);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || (user && !access) || groupLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAI && !canAccessAI) {
    const fallback = group === 'showcase' ? '/tests' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  if (access && !access.hasName) {
    return (
      <>
        {children}
        <FullNameModal
          userId={user.id}
          open={true}
          onComplete={() => {
            accessCache.set(user.id, { ...(access as AccessCacheEntry), hasName: true });
            setAccess({ ...(access as AccessCacheEntry), hasName: true });
          }}
        />
      </>
    );
  }

  if (
    access &&
    !access.diagnosticCompleted &&
    !skipDiagnosticCheck &&
    location.pathname !== '/diagnostic-test'
  ) {
    return <Navigate to="/diagnostic-test" replace />;
  }

  return <>{children}</>;
}
