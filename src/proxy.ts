import { NextResponse, type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

// Everything a signed-out visitor has no business seeing. Which *role* may see
// what is decided in the layouts, where reading the database is cheap; the docs
// warn against doing that here, since this runs on prefetches too.
const SIGNED_IN_ONLY = [
  '/dashboard',
  '/diary',
  '/history',
  '/supplements',
  '/profile',
  '/coach',
  '/onboarding',
]

// Next.js 16 renamed Middleware to Proxy; this file replaces middleware.ts.
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const { pathname } = request.nextUrl
  const needsAuth = SIGNED_IN_ONLY.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

  if (needsAuth && !user) {
    const login = new URL('/login', request.url)
    // Carries the destination so sign-in can return them to where they meant to go.
    login.searchParams.set('next', pathname)

    const redirectResponse = NextResponse.redirect(login)
    // The refreshed session cookies live on `response`; dropping them here would
    // sign the user out on the way to the login page.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie)
    }
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Every path except static assets and image files, which never need a
     * session refresh and would only burn latency.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
}
