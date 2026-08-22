'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * Keeps the signed-in session alive.
 *
 * Server Components cannot write cookies, so something has to rotate the access
 * token before it expires. That job normally falls to middleware — but Next.js 16
 * runs Proxy on the Node.js runtime only, and Cloudflare Workers cannot execute
 * it, so the work happens here instead.
 *
 * The browser client refreshes on its own timer and writes the new tokens to
 * document.cookie, which means the next server render already sees them. All this
 * component adds is a re-render when the auth state actually changes, so Server
 * Components do not sit on a stale view of who is signed in.
 */
export function SessionRefresher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // INITIAL_SESSION fires on every mount and matches what the server just
      // rendered; refreshing on it would loop.
      if (event === 'INITIAL_SESSION') return
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
