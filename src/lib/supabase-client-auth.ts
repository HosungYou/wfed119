/**
 * Client-side authentication helper for Supabase
 * Ensures session is properly loaded before making API calls
 */

import { createSupabaseClient } from './supabase';

export async function getAuthenticatedSession() {
  const supabase = createSupabaseClient();

  // Use getUser() for better security (authenticates via Auth server)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('[Auth] Error getting user:', userError);
    throw new Error('Failed to authenticate user');
  }

  if (!user) {
    console.error('[Auth] No user found');
    throw new Error('Not authenticated');
  }

  // Get session only after user verification
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('[Auth] Error getting session:', sessionError);
    throw new Error('Failed to get session');
  }

  return session;
}

export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  try {
    const session = await getAuthenticatedSession();

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${session.access_token}`);

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  } catch (error) {
    console.error('[Auth] Request failed:', error);
    throw error;
  }
}

export async function checkAuthStatus() {
  const supabase = createSupabaseClient();
  // Use getUser() for better security (authenticates via Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let session = null;

    if (!userError && user) {
      // Get session only after user verification
      const { data: { session: verifiedSession } } = await supabase.auth.getSession();
      session = verifiedSession;
    }

  return {
    isAuthenticated: !!session,
    session
  };
}
