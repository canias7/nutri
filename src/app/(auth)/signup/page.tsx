import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SignUpForm } from '@/components/auth/sign-up-form'
import { getViewer, homePathFor } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Create account · nutri' }

export default async function SignUpPage() {
  const viewer = await getViewer()
  if (viewer) redirect(homePathFor(viewer.profile.role))

  return (
    <>
      <header className="mb-5 flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Nutrition diary and wellbeing coaching.
        </p>
      </header>
      <SignUpForm />
    </>
  )
}
