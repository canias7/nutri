'use client'

import { useState } from 'react'

import { LengthText, UNIT_SUFFIX } from '@/components/units/readouts'
import { useUnits } from '@/components/units/unit-provider'
import { SITES, siteColumn } from '@/lib/client/measurement-sites'
import { formatShortDate } from '@/lib/diary/date'
import { formatLength, length, round } from '@/lib/units'

// Same validated accent as the other charts: inside the lightness band and above
// 3:1 contrast on both surfaces.
const ACCENT = '#059669'

const VIEW_W = 600
const VIEW_H = 170
const PAD_X = 12
const PAD_Y = 20

export type MeasurementRow = Record<string, number | string | null>

/**
 * One measurement site over time.
 *
 * The table above gives every number; this answers the different question of
 * which way a single site is going, which is hard to see across a grid of
 * columns. One site at a time rather than nine series on shared axes — they
 * share a unit but not a scale, and a waist and an upper arm plotted together
 * only flatten each other.
 */
export function MeasurementTrend({ rows }: { rows: MeasurementRow[] }) {
  const [site, setSite] = useState<string>('waistCm')
  const [active, setActive] = useState<number | null>(null)

  const column = siteColumn(site)
  // Oldest first so the line reads left to right.
  const points = rows
    .map((row) => ({
      date: String(row.measured_on),
      value: row[column] === null || row[column] === undefined ? null : Number(row[column]),
    }))
    .filter((p): p is { date: string; value: number } => p.value !== null)
    .reverse()

  const label = SITES.find((s) => s.name === site)?.label ?? 'Measurement'

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Change over time
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Which measurement</span>
          <select
            value={site}
            onChange={(event) => {
              setSite(event.target.value)
              setActive(null)
            }}
            className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm text-slate-800 dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
          >
            {SITES.map((s) => (
              <option key={s.name} value={s.name}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {points.length < 2 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Two sets of {label.toLowerCase()} measurements are needed before there is
          a line to draw.
        </p>
      ) : (
        <Chart points={points} label={label} active={active} setActive={setActive} />
      )}
    </section>
  )
}

function Chart({
  points,
  label,
  active,
  setActive,
}: {
  points: { date: string; value: number }[]
  label: string
  active: number | null
  setActive: (index: number | null) => void
}) {
  const { system } = useUnits()

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // A flat series would divide by zero and collapse onto one line.
  const span = max - min || 1
  const lo = min - span * 0.2
  const hi = max + span * 0.2

  const x = (i: number) =>
    PAD_X + (i * (VIEW_W - PAD_X * 2)) / Math.max(1, points.length - 1)
  const y = (v: number) => PAD_Y + ((hi - v) / (hi - lo)) * (VIEW_H - PAD_Y * 2)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const shown = active ?? points.length - 1
  const point = points[shown]
  const change = point.value - points[0].value

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums">
          <LengthText cm={point.value} unitClassName={UNIT_SUFFIX} />
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatShortDate(point.date)}
          {Math.abs(change) >= 0.05 ? (
            <span
              className={
                change < 0
                  ? ' font-semibold text-emerald-700 dark:text-emerald-400'
                  : ' font-semibold'
              }
            >
              {' '}
              ({change > 0 ? '+' : ''}
              {round(length.toDisplay(change, system), 1).toFixed(1)} overall)
            </span>
          ) : null}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-36 w-full touch-none"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label} across ${points.length} measurement sets, from ${formatLength(points[0].value, system)} to ${formatLength(points[points.length - 1].value, system)}`}
        onPointerLeave={() => setActive(null)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - rect.left) / rect.width
          const index = Math.round(ratio * (points.length - 1))
          setActive(Math.min(points.length - 1, Math.max(0, index)))
        }}
      >
        <line
          x1={PAD_X}
          y1={VIEW_H - PAD_Y}
          x2={VIEW_W - PAD_X}
          y2={VIEW_H - PAD_Y}
          stroke="currentColor"
          strokeWidth="1"
          className="text-black/10 dark:text-white/15"
        />

        <path
          d={line}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {active !== null ? (
          <line
            x1={x(active)}
            y1={PAD_Y}
            x2={x(active)}
            y2={VIEW_H - PAD_Y}
            stroke="currentColor"
            strokeWidth="1"
            className="text-black/25 dark:text-white/30"
          />
        ) : null}

        <circle
          cx={x(shown)}
          cy={y(point.value)}
          r="5"
          fill={ACCENT}
          stroke="var(--background)"
          strokeWidth="2"
        />
      </svg>
    </figure>
  )
}
