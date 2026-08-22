'use client'

import { useRef, useState } from 'react'

import { UNIT_SUFFIX, WeightText } from '@/components/units/readouts'
import { useUnits } from '@/components/units/unit-provider'
import { formatShortDate } from '@/lib/diary/date'
import { formatWeight } from '@/lib/units'

export type WeightPoint = { date: string; kg: number }

// Validated against both chart surfaces: inside the lightness band and above 3:1
// contrast in light and dark alike, so one value serves both themes.
const ACCENT = '#059669'

const VIEW_W = 600
const VIEW_H = 160
const PAD_X = 10
const PAD_Y = 18

export function WeightTrend({ points }: { points: WeightPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<number | null>(null)
  // The line itself stays in kilograms: pounds are a linear scale of them, so
  // converting would redraw exactly the same shape. Only the readings change.
  const { system } = useUnits()

  const values = points.map((p) => p.kg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  // A flat series would divide by zero and collapse onto one line; give it room.
  const span = max - min || 1
  const padded = { lo: min - span * 0.15, hi: max + span * 0.15 }

  const x = (i: number) =>
    PAD_X + (i * (VIEW_W - PAD_X * 2)) / Math.max(1, points.length - 1)
  const y = (kg: number) =>
    PAD_Y +
    ((padded.hi - kg) / (padded.hi - padded.lo)) * (VIEW_H - PAD_Y * 2)

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.kg)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${VIEW_H} L${x(0)},${VIEW_H} Z`

  const last = points.length - 1
  const shown = active ?? last
  const shownPoint = points[shown]

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const index = Math.round(ratio * (points.length - 1))
    setActive(Math.min(points.length - 1, Math.max(0, index)))
  }

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums">
          <WeightText kg={shownPoint.kg} unitClassName={UNIT_SUFFIX} />
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatShortDate(shownPoint.date)}
        </span>
      </figcaption>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-32 w-full touch-none"
        preserveAspectRatio="none"
        onPointerMove={handleMove}
        onPointerLeave={() => setActive(null)}
        role="img"
        aria-label={`Weight over the last ${points.length} logged days, from ${formatWeight(points[0].kg, system)} to ${formatWeight(points[last].kg, system)}`}
      >
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.18" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive baseline rather than a full grid: 14 points do not need one. */}
        <line
          x1={PAD_X}
          y1={VIEW_H - PAD_Y}
          x2={VIEW_W - PAD_X}
          y2={VIEW_H - PAD_Y}
          stroke="currentColor"
          strokeWidth="1"
          className="text-black/10 dark:text-white/15"
        />

        <path d={area} fill="url(#weight-fill)" />
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

        {/* The endpoint is emphasised; the rest appear on hover, so 14 markers
            never crowd the line. */}
        <circle
          cx={x(shown)}
          cy={y(shownPoint.kg)}
          r="5"
          fill={ACCENT}
          stroke="var(--background)"
          strokeWidth="2"
        />
      </svg>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-1.5 pr-4 font-medium">Date</th>
                <th scope="col" className="py-1.5 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-1.5 pr-4">{formatShortDate(point.date)}</td>
                  <td className="py-1.5 tabular-nums">
                    <WeightText kg={point.kg} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
