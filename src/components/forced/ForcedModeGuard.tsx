import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForcedLearning } from '@/hooks/useForcedLearning';

/**
 * Hard-blocks navigation while a learning session is active.
 * Allowed routes: /learn, /login, /signup, /pricing.
 * Anything else → redirect to /learn.
 *
 * Mounted once at the App root (inside Router) so it sees every navigation.
 */
const ALLOW = new Set(['/learn', '/login', '/signup']);

export function ForcedModeGuard() {
  const { isLocked, loading } = useForcedLearning();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isLocked) return;
    const path = location.pathname;
    if (ALLOW.has(path)) return;
    if (path.startsWith('/learn')) return;
    console.log('[FORCED_REDIRECT]', { from: path, to: '/learn' });
    navigate('/learn', { replace: true });
  }, [isLocked, loading, location.pathname, navigate]);

  return null;
}
