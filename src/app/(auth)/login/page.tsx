import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/auth/sign-in-form'
import { getViewer, homePathFor } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Sign in · nutri' }

export default async function LoginPage() {
  const viewer = await getViewer()
  if (viewer) redirect(homePathFor(viewer.profile.role))

  return (
    <>
      <header className="mb-5 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in to pick up your diary.
        </p>
      </header>
      <SignInForm />
    </>
  )
}
