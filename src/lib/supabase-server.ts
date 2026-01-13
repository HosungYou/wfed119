import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './supabase'
import { getSupabaseClientConfig } from './supabase'

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  const config = getSupabaseClientConfig('server')

  if (!config) {
    throw new Error('[Supabase] Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in server environment')
  }

  const { url, anonKey } = config

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Get verified user from Supabase Auth (recommended for most cases)
 * This is the primary authentication method - it validates the user token
 * by contacting the Supabase Auth server directly.
 *
 * Use this instead of getSession() to avoid "session.user" warnings.
 *
 * @returns User object if authenticated, null otherwise
 */
export const getVerifiedUser = async () => {
  const supabase = await createServerSupabaseClient()
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('[Supabase] getVerifiedUser error:', error)
    return null
  }
}

/**
 * Get user profile from database
 * Fetches the full user record from the users table
 *
 * @returns User record from database, null if not found
 */
export const getCurrentUser = async () => {
  const user = await getVerifiedUser()
  if (!user) return null

  const supabase = await createServerSupabaseClient()
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userData
}

/**
 * Get session with tokens (use only when you need access tokens)
 * WARNING: Avoid using session.user - use getVerifiedUser() instead
 *
 * This should only be used in rare cases where you need the actual
 * access/refresh tokens (e.g., for external API calls).
 *
 * @returns Session object if authenticated, null otherwise
 */
export const getSession = async () => {
  const user = await getVerifiedUser()
  if (!user) return null

  const supabase = await createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('[Supabase] getSession error:', error)
    return null
  }
}
