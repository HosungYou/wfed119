'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DreamsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified categories page
    router.replace('/discover/dreams/categories');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to Dream Life Matrix...</p>
      </div>
    </div>
  );
}
