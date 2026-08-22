import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { StressEnergy } from '@/components/dashboard/stress-energy'
import { WaterWeek } from '@/components/dashboard/water-week'
import { WeightSinceStart } from '@/components/dashboard/weight-since-start'
import { UNIT_SUFFIX, WeightChangeText, WeightText } from '@/components/units/readouts'
import { requireClient } from '@/lib/auth/session'
import { addDays, formatShortDate, streakFrom } from '@/lib/diary/date'
import { formatNumber } from '@/lib/format'
import { resolveToday } from '@/lib/diary/today'
import {
  getDiaryDay,
  getRecentLogs,
  getUnreadDays,
} from '@/lib/diary/queries'

export const metadata: Metadata = { title: 'Dashboard · nutri' }

export default async function DashboardPage() {
  const { viewer, client } = await requireClient()
  const today = await resolveToday()

  const [day, recent, unreadDays] = await Promise.all([
    getDiaryDay(viewer.id, today),
    getRecentLogs(viewer.id, 14),
    getUnreadDays(viewer.id),
  ])

  const firstName = viewer.profile.full_name.split(' ')[0] || 'there'
  const streak = streakFrom(new Set(recent.map((log) => log.log_date)), today)

  // Walked back from today rather than listing what exists, so a day with
  // nothing logged is a gap in the week instead of quietly not being there —
  // and so the window moves on by itself as the days pass.
  const logsByDate = new Map(recent.map((log) => [log.log_date, log]))
  const waterWeek = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6)
    const log = logsByDate.get(date)
    return { date, ml: log?.water_total_ml ?? 0, logged: Boolean(log) }
  })
  const waterToday = day.log?.water_total_ml ?? 0
  const waterPct = Math.min(100, Math.round((waterToday / client.water_target_ml) * 100))

  // Oldest first so the chart reads left to right.
  const weights = recent
    .filter((log) => log.weight_kg !== null)
    .map((log) => ({ date: log.log_date, kg: Number(log.weight_kg) }))
    .reverse()

  // Days where both were recorded; one without the other says nothing.
  const stressEnergy = recent
    .filter((log) => log.stress_level !== null && log.energy_level !== null)
    .map((log) => ({
      date: log.log_date,
      stress: Number(log.stress_level),
      energy: Number(log.energy_level),
    }))
    .reverse()

  const latestWeight = weights.at(-1)
  // Without a starting weight on the profile, the oldest morning in the window
  // stands in for it — a chart of movement is still worth drawing, and saying
  // which baseline it used is better than showing nothing.
  const profileStart = client.start_weight_kg ? Number(client.start_weight_kg) : null
  const baseline = profileStart ?? weights[0]?.kg ?? null
  const change =
    latestWeight && profileStart !== null ? latestWeight.kg - profileStart : null

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Hi {firstName}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {client.goal || 'No program goal set yet.'}
        </p>
      </header>

      {unreadDays.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            New replies from your nutritionist
          </h2>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
            They commented on these days. Tap one to open the discussion.
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {unreadDays.map((unread) => (
              <li key={unread.date}>
                <Link
                  href={`/diary/${unread.date}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-xs transition hover:bg-emerald-100 dark:bg-white/10 dark:text-emerald-200"
                >
                  {unread.date === today ? 'Today' : formatShortDate(unread.date)}
                  <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white tabular-nums">
                    {unread.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Water today"
          value={formatNumber(waterToday)}
          unit="ml"
          hint={`${waterPct}% of ${formatNumber(client.water_target_ml)} ml`}
          progress={waterPct}
        />
        <Stat
          label="Weight"
          value={
            latestWeight ? (
              <WeightText kg={latestWeight.kg} unitClassName={UNIT_SUFFIX} />
            ) : (
              '—'
            )
          }
          hint={
            change === null ? (
              'Log it each morning'
            ) : (
              <>
                <WeightChangeText kg={change} /> since starting
              </>
            )
          }
        />
        <Stat
          label="Streak"
          value={String(streak)}
          unit={streak === 1 ? 'day' : 'days'}
          hint={streak === 0 ? 'Start one today' : 'In a row'}
        />
      </section>

      <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Water, last 7 days
        </h2>
        <WaterWeek days={waterWeek} targetMl={client.water_target_ml} today={today} />
      </section>

      {baseline !== null && weights.length >= 2 ? (
        <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weight against your start
          </h2>
          <WeightSinceStart
            points={weights}
            startKg={baseline}
            baselineIsFirstLog={profileStart === null}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-black/15 p-5 dark:border-white/15">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weight against your start
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Not enough data to plot yet. Weigh yourself in the mornings and log it
            in the diary — two days is enough to start.
          </p>
        </section>
      )}

      {stressEnergy.length >= 3 ? (
        <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Stress against energy
          </h2>
          <StressEnergy points={stressEnergy} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          From your nutritionist
        </h2>
        <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
          {client.recommendations ||
            'No personal recommendations yet. Keep logging your diary — they are written from what you record.'}
        </p>
      </section>

    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  hint,
  progress,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint: ReactNode
  progress?: number
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        ) : null}
      </span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      {progress !== undefined ? (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
