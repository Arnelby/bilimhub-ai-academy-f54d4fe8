import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useForcedLearning } from '@/hooks/useForcedLearning';
import { ReportIssueButton } from '@/components/feedback/ReportIssueButton';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  let locked = false;
  try {
    locked = useForcedLearning().isLocked;
  } catch {
    // Provider not mounted (shouldn't happen) — fail open.
  }
  return (
    <div className="flex min-h-screen flex-col">
      {!locked && <Navbar />}
      <main className="flex-1">{children}</main>
      {!locked && showFooter && <Footer />}
      {!locked && <ReportIssueButton />}
    </div>
  );
}
