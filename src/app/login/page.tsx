'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setIsAuthenticated(!!data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setIsAuthenticated(!!session);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase sign-in error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign in</h1>
        <p className="text-sm text-gray-600 mb-6">
          Use Google to continue your LifeCraft session.
        </p>

        {loading ? (
          <div className="text-sm text-gray-500">Checking session...</div>
        ) : isAuthenticated ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3">
            You are already signed in.
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        )}

        <div className="mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
