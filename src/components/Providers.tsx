'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/lib/i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}
