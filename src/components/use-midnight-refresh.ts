'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Keeps a server-resolved "today" honest in a tab left open overnight.
 *
 * The date comes from the server, worked out from the browser's offset, so it
 * only moves on when something re-renders. This watches for the day turning
 * over and asks for one fresh render — guarded by the date it fired for, so two
 * clocks disagreeing cannot become a refresh loop.
 */
export function useMidnightRefresh(today: string) {
  const router = useRouter()
  const refreshedFor = useRef<string | null>(null)

  useEffect(() => {
    function check() {
      const now = new Date()
      const local = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')

      if (local > today && refreshedFor.current !== local) {
        refreshedFor.current = local
        router.refresh()
      }
    }

    const timer = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [today, router])
}
