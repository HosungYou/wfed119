import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/results',
  '/admin',
  '/discover',
  '/api',
]

// Routes that are public (no auth required)
const PUBLIC_ROUTES = [
  '/',
  '/auth/callback',
  '/api/health',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Middleware] Supabase environment variables missing. Bypassing auth check.')
    return res
  }

  const pathname = req.nextUrl.pathname

  // Skip auth checks for explicitly public routes FIRST (before any auth calls)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
  if (isPublicRoute) {
    return res
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Only check auth for protected routes
  // Use getUser() for better security (authenticates via Auth server)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  let session = null

  if (!userError && user) {
    // Get session only after user verification
    const { data: { session: verifiedSession }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('[Middleware] Session error:', sessionError.message)
    }
    session = verifiedSession
  } else if (userError) {
    // "Auth session missing" is expected for unauthenticated users, not an error
    // Only log unexpected errors
    if (userError.message !== 'Auth session missing!') {
      console.error('[Middleware] Unexpected auth error:', userError.message)
    }
  }

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  // Redirect to home if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    redirectUrl.searchParams.set('auth', 'required')
    return NextResponse.redirect(redirectUrl)
  }

  // Add user info to headers for API routes (optional enhancement)
  if (session?.user && pathname.startsWith('/api/')) {
    res.headers.set('x-user-id', session.user.id)
    res.headers.set('x-user-email', session.user.email || '')
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
