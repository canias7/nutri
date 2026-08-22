'use client'

import { useState } from 'react'

import { useUnits } from '@/components/units/unit-provider'
import { useMidnightRefresh } from '@/components/use-midnight-refresh'
import { formatShortDate } from '@/lib/diary/date'
import {
  formatWeight,
  formatWeightChange,
  weightDeltaAxisLabel,
  weightDeltaForAxis,
} from '@/lib/units'

/** One day of the window. `kg` is null on a morning nobody weighed. */
export type WeightPoint = { date: string; kg: number | null }

// Same validated accent as the other charts. The second pole is the one amber
// that clears colour-blind separation against it on both surfaces.
const DOWN = '#059669'
const UP = '#b45309'

// Sized to the box it actually renders into — about 310px wide in half a
// dashboard — because preserveAspectRatio is "none" and a 600-wide viewBox in a
// 310-wide box squashes every tick label to half its width.
const VIEW_W = 320
const VIEW_H = 200
const PAD_L = 42
const PAD_R = 28
const PAD_T = 16
const PAD_B = 16

/**
 * Every morning's weight as a distance from where the programme started.
 *
 * Zero is the starting weight rather than zero kilograms, which is the question
 * people actually put to a scale — a line drifting between 70 and 71 says far
 * less than a bar that is three kilos under where it began. Direction is carried
 * by which side of the rule a bar sits on as well as by its hue, so the reading
 * does not depend on telling two colours apart.
 */
export function WeightSinceStart({
  points,
  startKg,
  baselineIsFirstLog,
  today,
}: {
  points: WeightPoint[]
  /** Null until there is either a starting weight on file or one morning logged. */
  startKg: number | null
  baselineIsFirstLog: boolean
  today: string
}) {
  const { system } = useUnits()
  const [active, setActive] = useState<number | null>(null)

  // The window is counted back from today on the server, so it has to be told
  // when today moves on.
  useMidnightRefresh(today)

  // Null on a morning nobody weighed, and on every morning before there is
  // anything to measure against.
  const deltas = points.map((point) =>
    point.kg === null || startKg === null ? null : point.kg - startKg,
  )
  const measured = deltas.filter((delta): delta is number => delta !== null)
  const latest = measured.length > 0 ? measured[measured.length - 1] : 0

  // Symmetric around zero so the rule sits in the middle and up and down are
  // drawn at the same scale. An empty chart still gets a scale, so the frame is
  // drawn the same before the first weigh-in as after it.
  const reach = Math.max(0.5, ...measured.map(Math.abs)) * 1.3
  const y = (kg: number) =>
    PAD_T + ((reach - kg) / (reach * 2)) * (VIEW_H - PAD_T - PAD_B)
  const zero = y(0)

  const band = (VIEW_W - PAD_L - PAD_R) / Math.max(1, points.length)
  const barW = Math.max(3, Math.min(band - 5, 22))

  const shownDelta = active === null ? null : deltas[active]
  const shown =
    active === null || shownDelta === null
      ? null
      : { point: points[active], delta: shownDelta }

  return (
    <figure className="m-0 flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span
          className={`text-2xl font-semibold tabular-nums ${
            measured.length === 0
              ? 'text-slate-400 dark:text-slate-500'
              : (shown ? shown.delta : latest) > 0
                ? 'text-amber-700 dark:text-amber-500'
                : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {measured.length === 0
            ? '—'
            : formatWeightChange(shown ? shown.delta : latest, system)}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {shown && shown.point.kg !== null
            ? `${formatShortDate(shown.point.date)} · ${formatWeight(shown.point.kg, system)}`
            : startKg === null
              ? 'Weigh yourself in the mornings and this fills in'
              : `Against ${formatWeight(startKg, system)} ${
                  baselineIsFirstLog ? 'first logged' : 'at the start'
                }`}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="aspect-[8/5] w-full touch-none"
        preserveAspectRatio="none"
        role="img"
        aria-label={
          startKg === null
            ? 'Weight against your starting weight. Nothing logged yet.'
            : `Each day's weight as a distance from ${formatWeight(startKg, system)}; the latest is ${formatWeightChange(latest, system)}.`
        }
        onPointerLeave={() => setActive(null)}
      >
        {ticks(reach, system).map((tick) => (
          <g key={tick.kg}>
            <line
              x1={PAD_L}
              y1={y(tick.kg)}
              x2={VIEW_W - PAD_R}
              y2={y(tick.kg)}
              stroke="currentColor"
              strokeWidth="1"
              className="text-black/10 dark:text-white/15"
            />
            <text
              x={PAD_L - 7}
              y={y(tick.kg) + 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px] tabular-nums dark:fill-slate-500"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* The rule is the starting weight, so it is drawn as a real reference
            rather than as one more gridline. */}
        <line
          x1={PAD_L}
          y1={zero}
          x2={VIEW_W - PAD_R}
          y2={zero}
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-slate-400 dark:text-slate-500"
        />

        {points.map((point, index) => {
          const delta = deltas[index]
          const x = PAD_L + index * band + (band - barW) / 2

          return (
            <g key={point.date}>
              {delta === null ? (
                // A morning nobody weighed. Drawn as a bead on the rule rather
                // than skipped, so the fortnight keeps its shape and the gaps
                // are part of the picture — and lighter than the rule it sits
                // on, which is what tells the two apart.
                <rect
                  x={x}
                  y={zero - 3}
                  width={barW}
                  height={6}
                  rx="3"
                  fill="currentColor"
                  className="text-slate-300 dark:text-white/25"
                />
              ) : (
                <rect
                  x={x}
                  y={delta <= 0 ? zero : y(delta)}
                  width={barW}
                  height={Math.max(2, Math.abs(y(delta) - zero))}
                  rx="3"
                  fill={delta <= 0 ? DOWN : UP}
                  opacity={active === null || active === index ? 1 : 0.5}
                />
              )}
              <rect
                x={PAD_L + index * band}
                y={PAD_T}
                width={band}
                height={VIEW_H - PAD_T - PAD_B}
                fill="transparent"
                onPointerEnter={() => setActive(index)}
              />
            </g>
          )
        })}

        {/* Named, not numbered: "155 lb 7 oz" needs a gutter half the chart
            wide, and the caption above already carries the figure. */}
        {/* Anchored to the right edge rather than run out from the gutter, so
            the word cannot spill past the viewBox and get clipped. */}
        <text
          x={VIEW_W - 4}
          y={zero + 4}
          textAnchor="end"
          className="fill-slate-500 text-[10px] font-semibold dark:fill-slate-400"
        >
          start
        </text>
      </svg>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-1.5 pr-4 font-medium">Day</th>
                <th scope="col" className="py-1.5 pr-4 font-medium">Weight</th>
                <th scope="col" className="py-1.5 font-medium">Against start</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point, index) => (
                <tr key={point.date} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-1.5 pr-4">{formatShortDate(point.date)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">
                    {point.kg === null ? '—' : formatWeight(point.kg, system)}
                  </td>
                  <td className="py-1.5 tabular-nums">
                    {deltas[index] === null
                      ? 'Not weighed'
                      : formatWeightChange(deltas[index], system)}
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

/**
 * Round tick values in whichever unit is on screen, so an imperial reader gets
 * whole pounds rather than the odd numbers metric ones would convert to.
 */
function ticks(reachKg: number, system: 'metric' | 'imperial') {
  const reach = weightDeltaForAxis(reachKg, system)
  const unit = weightDeltaAxisLabel(system)
  const step = niceStep(reach)

  const out: { kg: number; label: string }[] = []
  for (let value = -Math.floor(reach / step) * step; value <= reach; value += step) {
    if (Math.abs(value) < step / 2) continue // zero is the rule, not a tick
    const kg = system === 'metric' ? value : value * 0.45359237
    const rounded = Math.round(value * 10) / 10
    out.push({
      kg,
      label: `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)} ${unit}`,
    })
  }
  return out
}

/** 1, 2 or 5 (times a power of ten) — whichever gives two or three lines. */
function niceStep(reach: number): number {
  const raw = reach / 2.2
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalised = raw / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}
