import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * DiagnosticTest now simply redirects to Math Test Variant 1.
 * After the test completes (handled by MathTestTaking),
 * user_tests gets a record and ProtectedRoute allows access.
 */
export default function DiagnosticTest() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if already completed
    const check = async () => {
      const { data } = await supabase
        .from('user_tests')
        .select('id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .limit(1)
        .maybeSingle();

      if (data) {
        // Already has a completed test — go to dashboard
        navigate('/dashboard');
      } else {
        // Redirect to Math Test Variant 1 as the diagnostic
        navigate('/tests/math-test/1', { replace: true });
      }
    };

    check();
  }, [user, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}
