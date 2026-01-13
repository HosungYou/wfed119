"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ResultsRedirect() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    // Redirect to dashboard with openEnneagram flag
    router.replace('/dashboard?openEnneagram=true');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <p className="text-gray-600">Redirecting to Dashboard...</p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    }>
      <ResultsRedirect />
    </Suspense>
  );
}
