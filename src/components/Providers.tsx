'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/lib/i18n';
import ConsentGuard from '@/components/auth/ConsentGuard';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConsentGuard>
          {children}
        </ConsentGuard>
      </AuthProvider>
    </LanguageProvider>
  );
}
