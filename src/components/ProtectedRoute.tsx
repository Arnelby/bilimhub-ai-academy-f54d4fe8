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

      const { data } = await supabase
        .from('user_diagnostic_profile')
        .select('diagnostic_completed')
        .eq('user_id', user.id)
        .single();

      setDiagnosticCompleted(data?.diagnostic_completed ?? false);
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
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }

  // Redirect to diagnostic test if not completed
  if (!diagnosticCompleted && !skipDiagnosticCheck && location.pathname !== '/diagnostic-test') {
    return <Navigate to="/diagnostic-test" replace />;
  }

  return <>{children}</>;
}
