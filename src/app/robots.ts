import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/site-url'

/**
 * The front door is public; everything behind it is not.
 *
 * The root layout marks the whole app `noindex`, and the landing page overrides
 * that for itself. This says the same thing to crawlers before they request
 * anything — a diary page returns a redirect to a signed-out crawler anyway, but
 * there is no reason to have it knocking.
 *
 * `/auth` and `/api` are left out deliberately: they carry one-time tokens, and
 * naming a path in robots.txt publishes it.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/diary',
        '/messages',
        '/profile',
        '/supplements',
        '/measurements',
        '/history',
        '/onboarding',
        '/coach',
      ],
    },
    host: siteUrl,
  }
}
