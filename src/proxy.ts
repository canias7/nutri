import type { NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

// Next.js 16 renamed Middleware to Proxy; this file replaces middleware.ts.
export async function proxy(request: NextRequest) {
  const { response } = await updateSession(request)
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
