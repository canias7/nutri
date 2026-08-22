import type { Metadata } from 'next'
import Link from 'next/link'

import { requireClient } from '@/lib/auth/session'
import { addDays, formatShortDate } from '@/lib/diary/date'
import { resolveToday } from '@/lib/diary/today'
import { getRecentLogs } from '@/lib/diary/queries'
import { formatNumber } from '@/lib/format'

export const metadata: Metadata = { title: 'History · nutri' }

const DAYS_SHOWN = 14

export default async function HistoryPage() {
  const { viewer } = await requireClient()
  const today = await resolveToday()
  const logs = await getRecentLogs(viewer.id, 60)

  const byDate = new Map(logs.map((log) => [log.log_date, log]))

  // Walking back from today rather than listing what exists, so missed days show
  // up as gaps instead of quietly not being there.
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, -i))
  const loggedCount = days.filter((date) => byDate.has(date)).length

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Log history</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The last {DAYS_SHOWN} days — {loggedCount} logged. Tap any day to fill it
          in or change it.
        </p>
      </header>

      <ul className="flex flex-col gap-1.5">
        {days.map((date) => {
          const log = byDate.get(date)
          const isToday = date === today

          return (
            <li key={date}>
              <Link
                href={`/diary/${date}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${
                      log ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
                    }`}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">
                      {isToday ? 'Today' : formatShortDate(date)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {log ? 'Logged' : 'Nothing logged'}
                    </span>
                  </span>
                </span>

                <span className="flex gap-3 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                  {log?.weight_kg ? <span>{Number(log.weight_kg).toFixed(1)} kg</span> : null}
                  {log && log.water_total_ml > 0 ? (
                    <span>{formatNumber(log.water_total_ml)} ml</span>
                  ) : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
