import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type SupabaseClientConfig = {
  url: string
  anonKey: string
}

const resolveSupabaseClientConfig = (context: 'client' | 'server'): SupabaseClientConfig => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const missing = [
      url ? null : 'NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)',
      anonKey ? null : 'NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)'
    ].filter(Boolean)

    throw new Error(
      `Supabase configuration is missing in ${context} environment. Set ${missing.join(
        ' and '
      )} before continuing.`
    )
  }

  return { url, anonKey }
}

const resolveServiceRoleKey = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined. Add it to your environment variables.')
  }

  return serviceRoleKey
}

// Client-side Supabase client
export const createSupabaseClient = () => {
  const { url, anonKey } = resolveSupabaseClientConfig('client')
  return createBrowserClient(url, anonKey)
}

// Server-side Supabase client with service role
export const createSupabaseAdmin = () => {
  const { url } = resolveSupabaseClientConfig('server')
  const serviceRoleKey = resolveServiceRoleKey()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const getSupabaseClientConfig = resolveSupabaseClientConfig
export const getSupabaseServiceRoleKey = resolveServiceRoleKey

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          image: string | null
          role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          image?: string | null
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          is_active?: boolean
        }
        Update: {
          email?: string | null
          name?: string | null
          image?: string | null
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          is_active?: boolean
        }
      }
      value_results: {
        Row: {
          id: string
          user_id: string
          value_set: string
          layout: any
          top3: any
          insights: any
          module_version: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          value_set: string
          layout: any
          top3: any
          insights?: any
          module_version?: string
        }
        Update: {
          layout?: any
          top3?: any
          insights?: any
          module_version?: string
        }
      }
      strength_profiles: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          user_email: string | null
          strengths: any
          summary: string | null
          insights: any
          created_at: string
          updated_at: string
        }
        Insert: {
          session_id: string
          user_id?: string | null
          user_email?: string | null
          strengths: any
          summary?: string | null
          insights?: any
        }
        Update: {
          strengths?: any
          summary?: string | null
          insights?: any
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string
          session_type: string
          current_stage: string
          completed: boolean
          completed_at: string | null
          started_at: string
          updated_at: string
          metadata: any
        }
        Insert: {
          user_id: string
          session_id: string
          session_type?: string
          current_stage?: string
          completed?: boolean
          completed_at?: string | null
          metadata?: any
        }
        Update: {
          session_type?: string
          current_stage?: string
          completed?: boolean
          completed_at?: string | null
          metadata?: any
        }
      }
    }
  }
}
