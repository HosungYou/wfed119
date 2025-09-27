import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './supabase'

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

export const getSession = async () => {
  const supabase = createServerSupabaseClient()
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

  const supabase = createServerSupabaseClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return user
}