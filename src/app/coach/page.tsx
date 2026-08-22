import type { Metadata } from 'next'
import Link from 'next/link'

import { requireCoach } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Clients · nutri' }

export default async function CoachPage() {
  const { nutritionist } = await requireCoach()
  const supabase = await createClient()

  // RLS narrows this to the clients linked to this coach. The relationship is
  // named explicitly because `clients` points at `profiles` twice — once for the
  // client, once for their coach — and an unqualified embed is ambiguous.
  const { data: clients } = await supabase
    .from('clients')
    .select(
      'profile_id, goal, onboarding_completed_at, profiles!clients_profile_id_fkey(full_name)',
    )
    .order('created_at', { ascending: false })

  const roster = clients ?? []

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your clients</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track the wellbeing and diet of everyone you coach.
        </p>
      </header>

      {roster.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-black/15 p-6 dark:border-white/15">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No clients yet.{' '}
            {nutritionist.invite_code
              ? 'Share your invite code so they can link to you.'
              : 'Set an invite code first, then share it with them.'}
          </p>
          {nutritionist.invite_code ? (
            <code className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-semibold dark:bg-white/10">
              {nutritionist.invite_code}
            </code>
          ) : (
            <Link
              href="/coach/settings"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Choose an invite code
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {roster.map((row) => (
            <li
              key={row.profile_id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-4 dark:border-white/10"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">
                  {row.profiles?.full_name || 'Unnamed client'}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {row.onboarding_completed_at
                    ? row.goal || 'No goal set'
                    : 'Has not finished onboarding yet'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
