import type { Metadata } from 'next'

import { CoachLinkForm, ProfileForm } from '@/components/profile/profile-form'
import { DeleteAccount } from '@/components/profile/delete-account'
import { UnitToggle } from '@/components/units/unit-provider'
import { requireClient } from '@/lib/auth/session'
import { signOut } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profile & goals · nutri' }

export default async function ProfilePage() {
  const { viewer, client } = await requireClient()

  let coachName: string | null = null
  if (client.nutritionist_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', client.nutritionist_id)
      .maybeSingle()
    coachName = data?.full_name ?? null
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Profile &amp; goals</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Change any of this whenever you like — it all feeds what your
          nutritionist sees.
        </p>
      </header>

      <CoachLinkForm coachName={coachName} />

      <ProfileForm fullName={viewer.profile.full_name} client={client} />

      <section className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold">Account</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Signed in as {viewer.email}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">Units</span>
          <UnitToggle />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
          >
            Sign out
          </button>
        </form>
      </section>

      <DeleteAccount fullName={viewer.profile.full_name} />
    </div>
  )
}
