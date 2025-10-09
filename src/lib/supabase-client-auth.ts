/**
 * Client-side authentication helper for Supabase
 * Ensures session is properly loaded before making API calls
 */

import { createSupabaseClient } from './supabase';

export async function getAuthenticatedSession() {
  const supabase = createSupabaseClient();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[Auth] Error getting session:', error);
    throw new Error('Failed to get session');
  }

  if (!session) {
    console.error('[Auth] No session found');
    throw new Error('Not authenticated');
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
  const { data: { session } } = await supabase.auth.getSession();

  return {
    isAuthenticated: !!session,
    session
  };
}
