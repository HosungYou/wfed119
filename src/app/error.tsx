'use client';

import React, { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log error to an error reporting service if desired
    // console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full bg-white border rounded-xl shadow-sm p-6 text-center">
        <div className="text-5xl mb-3">😵‍💫</div>
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">A client-side error occurred while loading the page.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload This Page
          </button>
          <button
            onClick={() => (typeof window !== 'undefined') && window.location.assign('/')}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Go Home
          </button>
        </div>
        {error?.message && (
          <details className="text-left text-xs text-gray-500 mt-4 whitespace-pre-wrap">
            <summary>Details</summary>
            {error.message}
          </details>
        )}
      </div>
    </div>
  );
}

