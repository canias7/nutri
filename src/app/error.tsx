'use client'

import { useEffect } from 'react'

/**
 * Catches anything that throws while rendering a page.
 *
 * Without this the reader gets Next's default screen, which in production says
 * nothing useful and offers no way back.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 8v5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>

      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Nothing you logged has been lost. Try again, and if it keeps happening
        let your nutritionist know.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
        >
          Back to dashboard
        </a>
      </div>

      {error.digest ? (
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  )
}
