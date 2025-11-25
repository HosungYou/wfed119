"use client";

import React from 'react';
import { ChatInterfaceWithContext } from '@/components/ChatInterfaceWithContext';
import { useEffect } from 'react';
import { useModuleProgress } from '@/hooks/useModuleProgress';

export default function StrengthsPage() {
  const { startModule } = useModuleProgress('strengths');

  useEffect(() => {
    startModule();
  }, [startModule]);

  return <ChatInterfaceWithContext moduleId="strengths" />;
}
