import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipDiagnosticCheck?: boolean;
}

export function ProtectedRoute({ children, skipDiagnosticCheck = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [diagnosticChecked, setDiagnosticChecked] = useState(false);
  const [diagnosticCompleted, setDiagnosticCompleted] = useState(true);

  useEffect(() => {
    async function checkDiagnostic() {
      if (!user || skipDiagnosticCheck) {
        setDiagnosticChecked(true);
        return;
      }

      // Check user_diagnostic_profile first
      const { data: profileData, error: profileError } = await supabase
        .from('user_diagnostic_profile')
        .select('diagnostic_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking diagnostic profile:', profileError);
      }

      if (profileData?.diagnostic_completed) {
        setDiagnosticCompleted(true);
        setDiagnosticChecked(true);
        return;
      }

      // Fallback: check if any completed test exists in user_tests
      const { data: testData } = await supabase
        .from('user_tests')
        .select('id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .limit(1)
        .maybeSingle();

      setDiagnosticCompleted(!!(profileData?.diagnostic_completed || testData));
      setDiagnosticChecked(true);
    }

    if (user) {
      checkDiagnostic();
    }
  }, [user, skipDiagnosticCheck]);

  if (loading || !diagnosticChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to diagnostic test if not completed
  if (!diagnosticCompleted && !skipDiagnosticCheck && location.pathname !== '/diagnostic-test') {
    return <Navigate to="/diagnostic-test" replace />;
  }

  return <>{children}</>;
}
