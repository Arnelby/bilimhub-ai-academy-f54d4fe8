import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FullNameModal } from '@/components/onboarding/FullNameModal';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useUserGroup } from '@/hooks/useUserGroup';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipDiagnosticCheck?: boolean;
  requireAI?: boolean;
}

export function ProtectedRoute({ children, skipDiagnosticCheck = false, requireAI = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { group, loading: groupLoading, canAccessAI } = useUserGroup();
  const location = useLocation();
  const [diagnosticChecked, setDiagnosticChecked] = useState(false);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(true);
  const [needsFullName, setNeedsFullName] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Track session automatically
  useSessionTracking(user?.id);

  useEffect(() => {
    async function checkProfile() {
      if (!user) {
        setProfileChecked(true);
        setDiagnosticChecked(true);
        return;
      }

      // Check profile for full_name and diagnostic in one query
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, name')
        .eq('id', user.id)
        .maybeSingle();

      const hasName = !!(profile?.full_name || profile?.name);
      setNeedsFullName(!hasName);
      setProfileChecked(true);

      if (skipDiagnosticCheck) {
        setDiagnosticChecked(true);
        return;
      }

      // Check diagnostic
      const { data: diagProfile } = await supabase
        .from('user_diagnostic_profile')
        .select('diagnostic_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (diagProfile?.diagnostic_completed) {
        setDiagnosticCompleted(true);
        setDiagnosticChecked(true);
        return;
      }

      const { data: testData } = await supabase
        .from('user_tests')
        .select('id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .limit(1)
        .maybeSingle();

      setDiagnosticCompleted(!!(diagProfile?.diagnostic_completed || testData));
      setDiagnosticChecked(true);
    }

    if (user) {
      checkProfile();
    }
  }, [user, skipDiagnosticCheck]);

  if (loading || !diagnosticChecked || !profileChecked || groupLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce experiment group restrictions
  if (requireAI && !canAccessAI) {
    return <Navigate to="/tests" replace />;
  }

  // Show full name modal if missing
  if (needsFullName) {
    return (
      <>
        {children}
        <FullNameModal
          userId={user.id}
          open={true}
          onComplete={() => setNeedsFullName(false)}
        />
      </>
    );
  }

  // Redirect to diagnostic test if not completed
  if (!diagnosticCompleted && !skipDiagnosticCheck && location.pathname !== '/diagnostic-test') {
    return <Navigate to="/diagnostic-test" replace />;
  }

  return <>{children}</>;
}
