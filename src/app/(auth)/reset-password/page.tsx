import type { Metadata } from 'next'
import Link from 'next/link'

import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { getViewer } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'New password · nutri' }

export default async function ResetPasswordPage() {
  // Arriving here means the recovery link put a session in place. Without one
  // the link has expired or was already used, which is worth saying plainly
  // rather than showing a form that cannot work.
  const viewer = await getViewer()

  if (!viewer) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">That link has expired</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Reset links can only be used once, and they don&apos;t last long. Ask for
          a fresh one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Send a new link
        </Link>
      </div>
    )
  }

  return (
    <>
      <header className="mb-5 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Signed in as {viewer.email}.
        </p>
      </header>
      <ResetPasswordForm />
    </>
  )
}
