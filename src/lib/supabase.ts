import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client
export const createSupabaseClient = () => {
  return createClientComponentClient()
}

// Server-side Supabase client with service role
export const createSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

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