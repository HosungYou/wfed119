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

export const getSession = async () => {
  const supabase = await createServerSupabaseClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export const getCurrentUser = async () => {
  const session = await getSession()
  if (!session?.user) return null

  const supabase = await createServerSupabaseClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return user
}
