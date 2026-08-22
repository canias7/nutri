'use client'

import { useEffect } from 'react'

import { TZ_COOKIE } from '@/lib/diary/date'

/**
 * Tells the server which day it is where the reader is.
 *
 * Workers run in UTC, so "today" derived there is wrong for anyone west of it
 * during their evening — they would open the diary and be handed tomorrow. The
 * offset is written once per load and read when resolving dates.
 */
export function TimezoneCookie() {
  useEffect(() => {
    const offset = new Date().getTimezoneOffset()
    // Lax rather than Strict: this is a display preference, not a credential,
    // and it needs to survive arriving from an email link.
    document.cookie = `${TZ_COOKIE}=${offset}; path=/; max-age=31536000; SameSite=Lax`
  }, [])

  return null
}
