import type { Metadata } from 'next'

import { Logo } from '@/components/logo'

export const metadata: Metadata = { title: 'Offline · nutri' }

export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
      <Logo />
      <h1 className="mt-2 text-xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Your diary needs a connection to load and to save. Nothing already saved
        has been lost — reconnect and carry on where you left off.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        If you were part-way through typing, keep this tab open: it is still
        there until you close it.
      </p>
    </div>
  )
}
