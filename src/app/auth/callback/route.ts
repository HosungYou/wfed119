import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = cookies()
    // Build redirect response early so we can set cookies directly on it
    const redirectUrl = new URL(next, requestUrl.origin)
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set on both cookieStore and the response so middleware sees them
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Verify session was properly set before redirecting
    const { data: { session }, error } = await supabase.auth.getSession()

    if (session && !error) {
      return response
    }

    console.error('[Auth Callback] Session verification failed:', error)
  }

  // Fallback: redirect to home if no code or session failed
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}