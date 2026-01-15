import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Verify session was properly set before redirecting
    const { data: { session }, error } = await supabase.auth.getSession()

    if (session && !error) {
      // Redirect to home page after successful login
      // HomePage will check sessionStorage for the intended redirect URL
      // This ensures auth cookies are properly set before client-side navigation
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }

    console.error('[Auth Callback] Session verification failed:', error)
  }

  // Fallback: redirect to home if no code or session failed
  return NextResponse.redirect(requestUrl.origin)
}