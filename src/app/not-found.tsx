import Link from 'next/link'

import { Logo } from '@/components/logo'

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <Logo />
      <h1 className="mt-2 text-xl font-semibold tracking-tight">Nothing here</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        That page doesn&apos;t exist. If you were looking for a particular day,
        open it from your history.
      </p>
      <div className="flex gap-2">
        <Link
          href="/dashboard"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Dashboard
        </Link>
        <Link
          href="/history"
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
        >
          History
        </Link>
      </div>
    </div>
  )
}
