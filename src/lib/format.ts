/**
 * Number formatting pinned to one locale.
 *
 * `toLocaleString()` with no locale uses whatever the runtime defaults to — and
 * the Worker's default is not the reader's. Server and client then render
 * "1,500" and "1500" for the same value, which React reports as a hydration
 * mismatch and which throws away the rest of the client render.
 */
const NUMBER = new Intl.NumberFormat('en-GB')

export function formatNumber(value: number): string {
  return NUMBER.format(value)
}
