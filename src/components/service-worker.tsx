'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker.
 *
 * Registration is deliberately late — after load — so it never competes with
 * the first render for bandwidth on the connection it is meant to help.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // A failed registration costs nothing: the app works without it.
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}
