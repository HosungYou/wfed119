import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Reconstruct the true public origin from reverse-proxy headers.
  // On Render.com (and similar platforms), request.url contains the internal
  // address (e.g. http://localhost:10000) — not the public URL.
  // x-forwarded-host / x-forwarded-proto carry the real external host/scheme.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin

  if (code) {
    const cookieStore = cookies()
    // Build redirect response early so we can set cookies directly on it
    const redirectUrl = new URL(next, origin)
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
  return NextResponse.redirect(new URL('/', origin))
}