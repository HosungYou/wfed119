'use client'

import { createSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email?: string
  name?: string
  image?: string
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      // Use getUser() for better security (authenticates via Auth server)
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (!userError && user) {
        // Use user object directly from getUser() to avoid warnings
        setUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name,
          image: user.user_metadata?.avatar_url
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Get user from getUser() to avoid warnings, even though onAuthStateChange is already verified
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setUser({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name,
              image: user.user_metadata?.avatar_url
            })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
        router.refresh()
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      console.error('Login error:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {user.image && (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span>{user.name || user.email}</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Login with Google
    </button>
  )
}
