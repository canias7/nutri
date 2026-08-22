import 'server-only'

import { cookies } from 'next/headers'

import { TZ_COOKIE, todayForOffset } from './date'

/**
 * Today's date for the person reading, not for the server.
 *
 * Workers run in UTC, so deriving "today" there hands someone in UTC-7 tomorrow
 * for the last seven hours of their evening. The browser writes its offset to a
 * cookie; this reads it back.
 *
 * Kept apart from ./date because `next/headers` cannot be imported from client
 * components, and the cookie name is needed on both sides.
 */
export async function resolveToday(): Promise<string> {
  const store = await cookies()
  const raw = store.get(TZ_COOKIE)?.value
  return todayForOffset(raw ? Number(raw) : null)
}
