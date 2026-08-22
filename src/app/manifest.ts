import type { MetadataRoute } from 'next'

/**
 * Makes the app installable to a home screen. A diary is opened several times a
 * day, which is exactly the case where a browser tab is the wrong container.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'nutri — nutrition diary & coaching',
    short_name: 'nutri',
    description:
      'Log how you eat, sleep, move and feel. Your nutritionist reads it and coaches you against it.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#059669',
    categories: ['health', 'lifestyle', 'food'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  }
}
