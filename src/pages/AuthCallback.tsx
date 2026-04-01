import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle both PKCE (code) and implicit (access_token in hash) flows
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = params.get('code');
        const accessToken = hashParams.get('access_token');
        const errorParam = params.get('error') || hashParams.get('error');
        const errorDescription = params.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setError(error.message);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            return;
          }
        } else if (accessToken) {
          // Implicit flow — session is set automatically by onAuthStateChange
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError('Не удалось установить сессию');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            return;
          }
        } else {
          // No code or token — just check if session already exists
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            navigate('/login', { replace: true });
            return;
          }
        }

        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Ошибка аутентификации');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-muted-foreground text-xs">Перенаправление на страницу входа...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}
