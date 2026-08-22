'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const DISMISSED_KEY = 'nutri_install_dismissed'
const DISMISS_EVENT = 'nutri:install-dismissed'

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** hidden: already installed or previously dismissed. ios: no API, needs instructions. */
type Mode = 'hidden' | 'ios' | 'awaiting-prompt'

function readMode(): Mode {
  try {
    if (window.localStorage.getItem(DISMISSED_KEY) === '1') return 'hidden'
  } catch {
    // Site data blocked; asking again is a small cost.
  }

  if (window.matchMedia('(display-mode: standalone)').matches) return 'hidden'

  const ua = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua)

  return isIos && isSafari ? 'ios' : 'awaiting-prompt'
}

function subscribe(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange)
  return () => window.removeEventListener(DISMISS_EVENT, onChange)
}

/**
 * Offers to install the app to the home screen.
 *
 * Two paths, because the platforms differ. Chrome and Android fire
 * `beforeinstallprompt`, which can be held and replayed behind a button. iOS
 * fires nothing and exposes no API — the only route there is Share → Add to
 * Home Screen, so it has to be written out, or iOS users never discover the app
 * is installable at all.
 */
export function InstallPrompt() {
  const mode = useSyncExternalStore<Mode>(subscribe, readMode, () => 'hidden')
  const [deferred, setDeferred] = useState<InstallEvent | null>(null)

  useEffect(() => {
    // State is set from the event handler, not from the effect body: the prompt
    // arrives when the browser decides, which may be well after mount.
    function onPrompt(event: Event) {
      event.preventDefault()
      setDeferred(event as InstallEvent)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // It will simply ask again next time.
    }
    setDeferred(null)
    window.dispatchEvent(new Event(DISMISS_EVENT))
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  const showIosHelp = mode === 'ios'
  const showInstallButton = mode === 'awaiting-prompt' && deferred !== null
  if (!showIosHelp && !showInstallButton) return null

  return (
    <aside className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 dark:bg-emerald-950/30">
      <span className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          Add nutri to your home screen
        </span>
        <span className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
          {showIosHelp
            ? 'Tap the Share button in Safari, then "Add to Home Screen".'
            : 'Opens straight to your diary, without hunting for a tab.'}
        </span>

        {showInstallButton ? (
          <button
            type="button"
            onClick={install}
            className="mt-1 w-fit rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Install
          </button>
        ) : null}
      </span>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-auto rounded-lg px-2 py-1 text-emerald-900/60 transition hover:bg-emerald-100 dark:text-emerald-200/60 dark:hover:bg-white/10"
      >
        ×
      </button>
    </aside>
  )
}
