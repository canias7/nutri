/*
 * Service worker for nutri.
 *
 * Deliberately narrow. Next.js build assets are content-hashed and immutable, so
 * they are safe to serve from cache first. Everything else goes to the network
 * first, because a diary that quietly shows yesterday's numbers is worse than
 * one that admits it is offline.
 *
 * This makes the app open and shell instantly, and gives a real page instead of
 * the browser's error when the connection drops. It does NOT queue writes —
 * anything you type offline still needs a connection to save, and the app says
 * so rather than pretending otherwise.
 */

const VERSION = 'nutri-v1'
const STATIC_CACHE = `${VERSION}-static`
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icon.svg']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only GET is ever cacheable. Server Actions are POSTs and must always reach
  // the network — a cached "saved" would be a lie about the reader's data.
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never touch auth or API traffic.
  if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) return

  // Hashed build output: safe to serve from cache and fill in behind.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
    return
  }

  // Page navigations: network first, offline page as the fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((hit) => hit ?? Response.error()),
      ),
    )
  }
})
