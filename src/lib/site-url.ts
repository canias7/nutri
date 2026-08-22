import { headers } from 'next/headers'

/**
 * Absolute origin of the running site, used to build the link Supabase puts in
 * confirmation emails.
 *
 * NEXT_PUBLIC_SITE_URL wins when set — behind a proxy the request headers
 * describe the hop, not the address the user typed. Falls back to the incoming
 * request so local development needs no configuration.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')

  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const protocol =
    headerList.get('x-forwarded-proto') ??
    (host?.startsWith('localhost') ? 'http' : 'https')

  return `${protocol}://${host ?? 'localhost:3000'}`
}
