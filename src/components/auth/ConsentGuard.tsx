'use client';

import { useAuth } from '@/contexts/AuthContext';
import ConsentModal from './ConsentModal';

/**
 * ConsentGuard - Wraps the app and shows consent modal for authenticated users
 * who haven't agreed to terms yet.
 */
export default function ConsentGuard({ children }: { children: React.ReactNode }) {
  const { needsConsent, markConsentComplete, consentLoading } = useAuth();

  // Show consent modal if user needs consent
  if (needsConsent) {
    return (
      <>
        {children}
        <ConsentModal
          isOpen={true}
          canClose={false}
          onSuccess={markConsentComplete}
        />
      </>
    );
  }

  // Show loading indicator while checking consent
  if (consentLoading) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
