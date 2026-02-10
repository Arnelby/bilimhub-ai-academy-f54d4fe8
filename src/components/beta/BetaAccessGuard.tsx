import { ReactNode } from 'react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { InviteCodeModal } from '@/components/beta/InviteCodeModal';
import { Loader2 } from 'lucide-react';

interface BetaAccessGuardProps {
  children: ReactNode;
}

export function BetaAccessGuard({ children }: BetaAccessGuardProps) {
  const { hasBetaAccess, loading } = useBetaAccess();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!hasBetaAccess) {
    return (
      <InviteCodeModal 
        open={true} 
        onSuccess={() => {
          // Reload to refresh state
          window.location.reload();
        }}
      />
    );
  }

  return <>{children}</>;
}
