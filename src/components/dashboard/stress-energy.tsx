'use client'

import { useState } from 'react'

import { formatShortDate } from '@/lib/diary/date'

export type StressEnergyPoint = { date: string; stress: number; energy: number }

// Same validated accent as the weight chart: inside the lightness band and above
// 3:1 against both surfaces.
const ACCENT = '#059669'

const SIZE = 260
const PAD = 34

/**
 * Stress against energy, one dot per logged day.
 *
 * A scatter rather than two lines: the question is whether the two move
 * together, and that is a shape you read at a glance here and cannot read from
 * two series on a shared time axis.
 */
export function StressEnergy({ points }: { points: StressEnergyPoint[] }) {
  const [active, setActive] = useState<number | null>(null)

  const x = (stress: number) => PAD + (stress / 10) * (SIZE - PAD * 2)
  const y = (energy: number) => SIZE - PAD - ((energy - 1) / 9) * (SIZE - PAD * 2)

  const correlation = pearson(
    points.map((p) => p.stress),
    points.map((p) => p.energy),
  )

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="text-sm text-slate-600 dark:text-slate-400">
        {correlation === null
          ? 'A few more days and a pattern may show.'
          : describe(correlation)}
      </figcaption>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-64 w-full max-w-md"
          role="img"
          aria-label={`Scatter plot of stress against energy for ${points.length} days`}
        >
          {/* Recessive frame: two axes, no full grid. */}
          <line
            x1={PAD}
            y1={SIZE - PAD}
            x2={SIZE - PAD}
            y2={SIZE - PAD}
            stroke="currentColor"
            strokeWidth="1"
            className="text-black/15 dark:text-white/20"
          />
          <line
            x1={PAD}
            y1={PAD}
            x2={PAD}
            y2={SIZE - PAD}
            stroke="currentColor"
            strokeWidth="1"
            className="text-black/15 dark:text-white/20"
          />

          <text x={SIZE / 2} y={SIZE - 8} textAnchor="middle" className="fill-current text-[10px] text-slate-500 dark:text-slate-400">
            Stress →
          </text>
          <text
            x={-SIZE / 2}
            y={12}
            transform="rotate(-90)"
            textAnchor="middle"
            className="fill-current text-[10px] text-slate-500 dark:text-slate-400"
          >
            Energy →
          </text>

          {points.map((point, index) => (
            <circle
              key={point.date}
              cx={x(point.stress)}
              cy={y(point.energy)}
              r={active === index ? 7 : 5}
              fill={ACCENT}
              fillOpacity={active === index ? 1 : 0.75}
              stroke="var(--background)"
              strokeWidth="2"
              className="cursor-pointer"
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              aria-label={`${formatShortDate(point.date)}: stress ${point.stress}, energy ${point.energy}`}
            />
          ))}
        </svg>
      </div>

      {active !== null ? (
        <p className="text-sm font-medium tabular-nums">
          {formatShortDate(points[active].date)} — stress {points[active].stress}/10,
          energy {points[active].energy}/10
        </p>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-1.5 pr-4 font-medium">Date</th>
                <th scope="col" className="py-1.5 pr-4 font-medium">Stress</th>
                <th scope="col" className="py-1.5 font-medium">Energy</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-1.5 pr-4">{formatShortDate(point.date)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{point.stress}</td>
                  <td className="py-1.5 tabular-nums">{point.energy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

/** Needs at least three days to say anything that is not just noise. */
function pearson(a: number[], b: number[]): number | null {
  const n = a.length
  if (n < 3) return null

  const meanA = a.reduce((s, v) => s + v, 0) / n
  const meanB = b.reduce((s, v) => s + v, 0) / n

  let top = 0
  let leftSq = 0
  let rightSq = 0
  for (let i = 0; i < n; i += 1) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    top += da * db
    leftSq += da * da
    rightSq += db * db
  }

  const bottom = Math.sqrt(leftSq * rightSq)
  return bottom === 0 ? null : top / bottom
}

function describe(r: number): string {
  const strength = Math.abs(r)
  if (strength < 0.3) return 'No clear link between your stress and your energy so far.'
  const direction =
    r < 0
      ? 'Higher-stress days tend to be lower-energy ones'
      : 'Higher-stress days tend to be higher-energy ones'
  return `${direction} — ${strength >= 0.6 ? 'a strong pattern' : 'a mild pattern'} in your logs.`
}
