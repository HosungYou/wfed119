'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasConsent: boolean | null;
  consentLoading: boolean;
  needsConsent: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkConsent: () => Promise<boolean>;
  markConsentComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);

  // Memoize supabase client to avoid recreation
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Initialize auth state
  useEffect(() => {
    // Skip auth init if supabase client is not available (build time)
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const initAuth = async () => {
      try {
        // Use getUser() for better security (authenticates via Auth server)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        let initialSession = null;

        if (!userError && user) {
          // Get session only after user verification
          const { data: { session: verifiedSession } } = await supabase.auth.getSession();
          initialSession = verifiedSession;
        }

        setSession(initialSession);
        // Use user object directly from getUser() to avoid warnings
        setUser(user ?? null);
      } catch (error) {
        console.error('[AuthContext] Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    // Note: onAuthStateChange provides already-verified sessions from Supabase Auth server
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log('[AuthContext] Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      console.warn('[AuthContext] Supabase client not available');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[AuthContext] Sign in failed:', error);
      setLoading(false);
      throw error;
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      console.warn('[AuthContext] Supabase client not available');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        throw error;
      }

      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('[AuthContext] Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      console.warn('[AuthContext] Supabase client not available');
      return;
    }
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[AuthContext] Refresh session error:', error);
        throw error;
      }

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      console.error('[AuthContext] Refresh session failed:', error);
      throw error;
    }
  }, [supabase]);

  // Check if user has consent
  const checkConsent = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setHasConsent(null);
      return false;
    }

    setConsentLoading(true);
    try {
      const res = await fetch('/api/auth/consent');
      if (!res.ok) {
        setHasConsent(false);
        return false;
      }

      const data = await res.json();
      const consentStatus = !!data.hasConsent;
      setHasConsent(consentStatus);
      return consentStatus;
    } catch (error) {
      console.error('[AuthContext] Error checking consent:', error);
      setHasConsent(false);
      return false;
    } finally {
      setConsentLoading(false);
    }
  }, [user]);

  // Mark consent as complete (after successful consent submission)
  const markConsentComplete = useCallback(() => {
    setHasConsent(true);
  }, []);

  // Check consent when user changes
  useEffect(() => {
    if (user && hasConsent === null) {
      checkConsent();
    } else if (!user) {
      setHasConsent(null);
    }
  }, [user, hasConsent, checkConsent]);

  // Compute if user needs consent
  const needsConsent = !!user && hasConsent === false && !consentLoading;

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    hasConsent,
    consentLoading,
    needsConsent,
    signInWithGoogle,
    signOut,
    refreshSession,
    checkConsent,
    markConsentComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Optional: Hook for requiring authentication
export function useRequireAuth(redirectTo: string = '/') {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [loading, isAuthenticated, redirectTo]);

  return { user, loading, isAuthenticated };
}
