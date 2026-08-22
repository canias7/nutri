import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Link expired · nutri' }

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <span
        aria-hidden
        className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 8v5" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>

      <h1 className="text-xl font-semibold tracking-tight">That link didn&apos;t work</h1>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Confirmation links expire, and they can only be used once. Sign in to have
        a fresh one sent.
      </p>

      <Link
        href="/login"
        className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        Back to sign in
      </Link>
    </div>
  )
}
