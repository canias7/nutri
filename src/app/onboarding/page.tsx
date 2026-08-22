import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Logo } from '@/components/logo'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { hasCompletedOnboarding, requireClient } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Set up your program · nutri' }

export default async function OnboardingPage() {
  const { viewer, client } = await requireClient()
  if (hasCompletedOnboarding(client)) redirect('/dashboard')

  const firstName = viewer.profile.full_name.split(' ')[0]

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-10">
      <Logo className="mb-7" />

      <header className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {firstName ? `Welcome, ${firstName}` : 'Welcome'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          A few things before you start logging. All of it can be changed later
          from your profile.
        </p>
      </header>

      <OnboardingForm />
    </div>
  )
}
