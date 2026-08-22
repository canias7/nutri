import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from './database.types'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env'

/**
 * Refreshes the Supabase session on every request and returns the response the
 * refreshed auth cookies were written to.
 *
 * Server Components cannot set cookies, so without this the access token would
 * expire and never be renewed. Anything that replaces this response must copy
 * its cookies across, or users get signed out at random.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        // Marks the response uncacheable, so a CDN never serves one user's
        // refreshed session to somebody else.
        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue)
        }
      },
    },
  })

  // Must run before the response is generated, otherwise a refresh that lands
  // late cannot write its cookies and every request refreshes again.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
