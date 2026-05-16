import { Navigate } from 'react-router-dom';
import { RESEARCH_MODE } from '@/lib/researchMode';

// Pricing page is hidden in RESEARCH_MODE (academic/research build).
// The full monetization UI is preserved in git history and can be restored
// by setting RESEARCH_MODE = false in src/lib/researchMode.ts.
export default function Pricing() {
  if (RESEARCH_MODE) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
