import type { Metadata } from 'next'
import Link from 'next/link'

import { requireClient } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Dashboard · nutri' }

export default async function DashboardPage() {
  const { viewer, client } = await requireClient()
  const firstName = viewer.profile.full_name.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Hi {firstName}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {client.goal || 'No program goal set yet.'}
        </p>
      </header>

      <Link
        href="/diary"
        className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 p-5 text-white shadow-sm transition hover:bg-emerald-700"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">Log today&apos;s entry</span>
          <span className="text-sm text-emerald-50/90">
            Fill it in through the day — everything saves as you type.
          </span>
        </span>
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Water today" value="—" hint={`Target ${client.water_target_ml} ml`} />
        <Stat label="Weight" value="—" hint="Log it each morning" />
        <Stat label="Streak" value="—" hint="Days in a row" />
      </section>

      <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Coach recommendations
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {client.recommendations ||
            'Your nutritionist has not added personal recommendations yet. Keep logging your diary.'}
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
    </div>
  )
}
