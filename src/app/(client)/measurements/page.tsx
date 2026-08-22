import type { Metadata } from 'next'

import { MeasurementsForm } from '@/components/measurements/measurements-form'
import { SITES, siteColumn } from '@/lib/client/measurement-sites'
import { requireClient } from '@/lib/auth/session'
import { formatShortDate } from '@/lib/diary/date'
import { resolveToday } from '@/lib/diary/today'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

export const metadata: Metadata = { title: 'Measurements · nutri' }

type Measurement = Tables<'body_measurements'>

const NUDGE_AFTER_DAYS = 14

export default async function MeasurementsPage() {
  const { viewer } = await requireClient()
  const today = await resolveToday()
  const supabase = await createClient()

  const { data } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('client_id', viewer.id)
    .order('measured_on', { ascending: false })
    .limit(12)

  const history = data ?? []
  const latest = history[0] ?? null

  const daysSince = latest
    ? Math.floor(
        (Date.parse(`${today}T00:00:00Z`) -
          Date.parse(`${latest.measured_on}T00:00:00Z`)) /
          86_400_000,
      )
    : null

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Body measurements</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Taken every couple of weeks, in the morning before eating. Volume often
          moves while the scale sits still, so this is where progress shows first.
        </p>
      </header>

      {daysSince !== null && daysSince >= NUDGE_AFTER_DAYS ? (
        <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          It has been {daysSince} days since your last set. Worth taking new ones.
        </p>
      ) : null}

      <MeasurementsForm today={today} latest={latest} />

      {history.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Previous sets
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <th scope="col" className="px-4 py-2.5 font-medium">Date</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Weight</th>
                  {SITES.map((site) => (
                    <th key={site.name} scope="col" className="px-4 py-2.5 font-medium whitespace-nowrap">
                      {site.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, index) => (
                  <Row key={row.id} row={row} previous={history[index + 1]} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Change is shown against the set before it.
          </p>
        </section>
      ) : null}
    </div>
  )
}

function Row({ row, previous }: { row: Measurement; previous?: Measurement }) {
  return (
    <tr className="border-b border-black/5 last:border-0 dark:border-white/5">
      <td className="px-4 py-2.5 whitespace-nowrap font-medium">
        {formatShortDate(row.measured_on)}
      </td>
      <Cell value={row.weight_kg} before={previous?.weight_kg} unit="kg" />
      {SITES.map((site) => {
        const column = siteColumn(site.name) as keyof Measurement
        return (
          <Cell
            key={site.name}
            value={row[column] as number | null}
            before={previous?.[column] as number | null | undefined}
          />
        )
      })}
    </tr>
  )
}

function Cell({
  value,
  before,
  unit,
}: {
  value: number | null
  before?: number | null
  unit?: string
}) {
  if (value === null) {
    return <td className="px-4 py-2.5 text-slate-400 dark:text-slate-600">—</td>
  }

  const delta =
    before === null || before === undefined ? null : Number(value) - Number(before)

  return (
    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
      {Number(value).toFixed(1)}
      {unit ? <span className="text-xs text-slate-500"> {unit}</span> : null}
      {delta !== null && Math.abs(delta) >= 0.05 ? (
        <span
          className={`ml-1.5 text-xs font-medium ${
            delta < 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta.toFixed(1)}
        </span>
      ) : null}
    </td>
  )
}
