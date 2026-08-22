import type { Metadata } from 'next'
import Link from 'next/link'

import { WeightTrend } from '@/components/dashboard/weight-trend'
import { requireClient } from '@/lib/auth/session'
import { formatShortDate, streakFrom } from '@/lib/diary/date'
import { resolveToday } from '@/lib/diary/today'
import {
  completedSections,
  getDiaryDay,
  getRecentLogs,
  SECTION_LABELS,
} from '@/lib/diary/queries'

export const metadata: Metadata = { title: 'Dashboard · nutri' }

export default async function DashboardPage() {
  const { viewer, client } = await requireClient()
  const today = await resolveToday()

  const [day, recent] = await Promise.all([
    getDiaryDay(viewer.id, today),
    getRecentLogs(viewer.id, 14),
  ])

  const firstName = viewer.profile.full_name.split(' ')[0] || 'there'
  const done = completedSections(day)
  const totalSections = Object.keys(SECTION_LABELS).length

  const streak = streakFrom(new Set(recent.map((log) => log.log_date)), today)
  const waterToday = day.log?.water_total_ml ?? 0
  const waterPct = Math.min(100, Math.round((waterToday / client.water_target_ml) * 100))

  // Oldest first so the chart reads left to right.
  const weights = recent
    .filter((log) => log.weight_kg !== null)
    .map((log) => ({ date: log.log_date, kg: Number(log.weight_kg) }))
    .reverse()

  const latestWeight = weights.at(-1)
  const startWeight = client.start_weight_kg ? Number(client.start_weight_kg) : null
  const change =
    latestWeight && startWeight !== null ? latestWeight.kg - startWeight : null

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
          <span className="text-base font-semibold">
            {done.size === 0
              ? "Log today's entry"
              : done.size === totalSections
                ? "Today's diary is complete"
                : 'Carry on with today'}
          </span>
          <span className="text-sm text-emerald-50/90">
            {done.size} of {totalSections} sections filled in
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="size-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Water today"
          value={waterToday.toLocaleString()}
          unit="ml"
          hint={`${waterPct}% of ${client.water_target_ml.toLocaleString()} ml`}
          progress={waterPct}
        />
        <Stat
          label="Weight"
          value={latestWeight ? latestWeight.kg.toFixed(1) : '—'}
          unit={latestWeight ? 'kg' : undefined}
          hint={
            change === null
              ? 'Log it each morning'
              : `${change >= 0 ? '+' : ''}${change.toFixed(1)} kg since starting`
          }
        />
        <Stat
          label="Streak"
          value={String(streak)}
          unit={streak === 1 ? 'day' : 'days'}
          hint={streak === 0 ? 'Start one today' : 'In a row'}
        />
      </section>

      {weights.length >= 2 ? (
        <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weight, last 14 days
          </h2>
          <WeightTrend points={weights} />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-black/15 p-5 dark:border-white/15">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Weight trend
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Not enough data to plot yet. Weigh yourself in the mornings and log it
            in the diary — two days is enough to start a line.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          From your nutritionist
        </h2>
        <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">
          {client.recommendations ||
            'No personal recommendations yet. Keep logging your diary — they are written from what you record.'}
        </p>
      </section>

      {recent.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent days
            </h2>
            <Link
              href="/history"
              className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              All history
            </Link>
          </div>
          <ul className="flex flex-col gap-1.5">
            {recent.slice(0, 5).map((log) => (
              <li key={log.id}>
                <Link
                  href={`/diary/${log.log_date}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3 text-sm transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <span className="font-medium">
                    {log.log_date === today ? 'Today' : formatShortDate(log.log_date)}
                  </span>
                  <span className="flex gap-3 tabular-nums text-slate-500 dark:text-slate-400">
                    {log.weight_kg ? <span>{Number(log.weight_kg).toFixed(1)} kg</span> : null}
                    <span>{log.water_total_ml.toLocaleString()} ml</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
  value: string
  unit?: string
  hint: string
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
