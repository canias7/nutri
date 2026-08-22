import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { StressEnergy } from '@/components/dashboard/stress-energy'
import { WeightTrend } from '@/components/dashboard/weight-trend'
import { UNIT_SUFFIX, WeightChangeText, WeightText } from '@/components/units/readouts'
import { requireClient } from '@/lib/auth/session'
import { formatShortDate, streakFrom } from '@/lib/diary/date'
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

  const wateredDays = recent.filter((log) => log.water_total_ml > 0)
  const weeklyWaterAverage =
    wateredDays.length > 0
      ? Math.round(
          wateredDays.reduce((sum, log) => sum + log.water_total_ml, 0) /
            wateredDays.length,
        )
      : null

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

      {weeklyWaterAverage !== null ? (
        <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
          Averaging{' '}
          <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {formatNumber(weeklyWaterAverage)} ml
          </span>{' '}
          of water across the {wateredDays.length} day
          {wateredDays.length === 1 ? '' : 's'} you have logged.
        </p>
      ) : null}

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
                    {log.weight_kg ? (
                      <span>
                        <WeightText kg={Number(log.weight_kg)} />
                      </span>
                    ) : null}
                    <span>{formatNumber(log.water_total_ml)} ml</span>
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
