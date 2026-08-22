// Deliberately free of server-only imports: the timezone cookie is written from
// the browser, so this module is reached from both sides. Anything needing
// `next/headers` lives in ./today instead.

/** Name of the cookie the browser writes with its UTC offset, in minutes. */
export const TZ_COOKIE = 'nutri_tz_offset'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateParam(value: string): boolean {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value))
}

export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Today's date given a browser's UTC offset in minutes.
 *
 * `getTimezoneOffset` is positive west of UTC, so it is subtracted rather than
 * added. An absent or unparseable offset falls back to UTC, which is at worst a
 * day out for some readers rather than wrong for all of them.
 */
export function todayForOffset(offsetMinutes: number | null): string {
  const safe = Number.isFinite(offsetMinutes) ? (offsetMinutes as number) : 0
  return toDateParam(new Date(Date.now() - safe * 60_000))
}

// Spelled out rather than formatted through Intl. Workerd and the browser ship
// different ICU builds, so the same `en-GB` request comes back as "Sat, 22 Aug"
// on one and "Sat 22 Aug" on the other — which React reports as a hydration
// mismatch and which throws away the client render of everything below it.
const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function parts(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  return {
    weekday: WEEKDAYS[value.getUTCDay()],
    day: value.getUTCDate(),
    month: MONTHS[value.getUTCMonth()],
  }
}

/** "Saturday 22 August" — for headings where the year is obvious. */
export function formatLongDate(date: string): string {
  const { weekday, day, month } = parts(date)
  return `${weekday} ${day} ${month}`
}

/** "Sat 22 Aug" — for lists. */
export function formatShortDate(date: string): string {
  const { weekday, day, month } = parts(date)
  return `${weekday.slice(0, 3)} ${day} ${month.slice(0, 3)}`
}

export function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + days)
  return toDateParam(next)
}

/**
 * How many days up to and including `today` have entries, counting back until
 * the first gap.
 */
export function streakFrom(dates: Set<string>, today: string): number {
  let streak = 0
  let cursor = today

  // A day still in progress should not break the streak, so an empty today
  // just means the count starts from yesterday.
  if (!dates.has(cursor)) cursor = addDays(cursor, -1)

  while (dates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}
