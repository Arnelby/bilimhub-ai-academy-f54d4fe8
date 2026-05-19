import { useAuth } from '@/hooks/useAuth';
import { useSessionTracking } from '@/hooks/useSessionTracking';

/**
 * Mounted once at app root so session tracking does not restart
 * on every protected-route navigation.
 */
export function SessionTrackingRoot() {
  const { user } = useAuth();
  useSessionTracking(user?.id);
  return null;
}
