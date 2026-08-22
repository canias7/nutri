import type { Metadata } from 'next'

import { InviteCodeForm } from '@/components/coach/invite-code-form'
import { requireCoach } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Invite code · nutri' }

export default async function CoachSettingsPage() {
  const { nutritionist } = await requireCoach()

  return (
    <div className="flex max-w-md flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invite code</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          One code, shared with every client you take on. They enter it when they
          sign up, and their diary links to you.
        </p>
      </header>

      <InviteCodeForm current={nutritionist.invite_code} />
    </div>
  )
}
