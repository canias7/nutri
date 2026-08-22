'use client'

import { useState } from 'react'

import { useMidnightRefresh } from '@/components/use-midnight-refresh'
import { WEEKDAY_INITIALS } from '@/lib/diary/date'
import { formatNumber } from '@/lib/format'

export type WaterDay = { date: string; ml: number }

// Same validated accent as the other charts: inside the lightness band and above
// 3:1 contrast on both surfaces.
const ACCENT = '#059669'

const VIEW_W = 600
const VIEW_H = 150
const PAD_X = 6
const PAD_TOP = 14
const PAD_BOTTOM = 10
/** Room on the right for the target figure, so it never sits over a bar. */
const GUTTER = 52

/**
 * The week's water against the target.
 *
 * The tile above says how today is going; this says whether today is typical.
 * One bar a day, filled solid on the days that reached the target and left pale
 * on the days that did not — the same hue throughout, because the question is
 * magnitude, not which category a day belongs to.
 *
 * Days with nothing logged are drawn as empty rather than skipped. A week with
 * two blanks in it is the useful picture; five bars pretending to be seven is
 * not.
 */
export function WaterWeek({
  days,
  targetMl,
  today,
}: {
  days: WaterDay[]
  targetMl: number
  today: string
}) {
  const [active, setActive] = useState<number | null>(null)

  // The window is worked out from today on the server, so it has to be told when
  // today moves on.
  useMidnightRefresh(today)

  const met = days.filter((day) => day.ml >= targetMl).length
  // Averaged over the days with water in them. A day whose diary was opened for
  // something else is not a day of nothing to drink — it drags the mean down
  // for no reason.
  const drank = days.filter((day) => day.ml > 0)
  const average =
    drank.length > 0
      ? Math.round(drank.reduce((sum, day) => sum + day.ml, 0) / drank.length)
      : 0

  // Headroom above whichever is taller, so a day that overshoots still fits.
  const ceiling = Math.max(targetMl, ...days.map((day) => day.ml)) * 1.12 || 1
  const plotW = VIEW_W - PAD_X * 2 - GUTTER
  const band = plotW / days.length
  // Slim and capped: a seventh of the width is a block, not a bar.
  const barW = Math.min(Math.max(6, band - 16), 34)
  const y = (ml: number) =>
    PAD_TOP + (1 - ml / ceiling) * (VIEW_H - PAD_TOP - PAD_BOTTOM)
  const baseline = VIEW_H - PAD_BOTTOM
  const targetTop = y(targetMl)

  const shown = active === null ? null : days[active]

  return (
    <figure className="m-0 flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {/* The average stays put while a column is hovered — that day's own
            figure appears over its bar instead, where it is being pointed at. */}
        {/* A week with nothing in it has no average — "0 ml" would read as a
            week of drinking nothing rather than a week nobody logged. */}
        <span
          className={`text-2xl font-semibold tabular-nums ${
            drank.length === 0 ? 'text-slate-400 dark:text-slate-500' : ''
          }`}
        >
          {drank.length === 0 ? '—' : formatNumber(average)}
          {drank.length > 0 ? (
            <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              ml
            </span>
          ) : null}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {shown ? label(shown.date, today) : 'Daily average'}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-32 w-full touch-none"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Water over the last ${days.length} days against a ${formatNumber(targetMl)} ml target; reached on ${met} of them.`}
        onPointerLeave={() => setActive(null)}
      >
        {days.map((day, index) => {
          const x = PAD_X + index * band + (band - barW) / 2
          const reached = day.ml >= targetMl
          const top = y(day.ml)
          const dim = active !== null && active !== index

          return (
            <g key={day.date} opacity={dim ? 0.45 : 1}>
              {/* A slot the height of the target behind every day. Seven of
                  these read as a week; seven bars over an empty field read as
                  one day that happened and six that broke. */}
              <rect
                x={x}
                y={targetTop}
                width={barW}
                height={baseline - targetTop}
                rx="5"
                fill="currentColor"
                className="text-slate-100 dark:text-white/[0.07]"
              />

              {day.ml > 0 ? (
                <rect
                  x={x}
                  y={top}
                  width={barW}
                  height={Math.max(4, baseline - top)}
                  rx="5"
                  fill={reached ? ACCENT : 'currentColor'}
                  className={reached ? '' : 'text-emerald-400 dark:text-emerald-700'}
                />
              ) : null}

              {active === index ? (
                <text
                  x={x + barW / 2}
                  y={Math.min(top, targetTop) - 7}
                  textAnchor="middle"
                  className="fill-slate-900 text-[11px] font-semibold tabular-nums dark:fill-slate-100"
                >
                  {formatNumber(day.ml)}
                </text>
              ) : null}

              <rect
                x={PAD_X + index * band}
                y={PAD_TOP}
                width={band}
                height={VIEW_H - PAD_TOP}
                fill="transparent"
                onPointerEnter={() => setActive(index)}
              />
            </g>
          )
        })}

        <line
          x1={PAD_X}
          y1={baseline}
          x2={VIEW_W - PAD_X - GUTTER + 4}
          y2={baseline}
          stroke="currentColor"
          strokeWidth="1"
          className="text-black/10 dark:text-white/15"
        />

        {/* Sat loose in the gutter before, reading as a stray number. On its
            own chip it is plainly the label for the line the slots end on. */}
        <g>
          <rect
            x={VIEW_W - PAD_X - GUTTER + 6}
            y={targetTop - 9}
            width={GUTTER - 10}
            height={18}
            rx="9"
            fill="currentColor"
            className="text-slate-100 dark:text-white/10"
          />
          <text
            x={VIEW_W - PAD_X - GUTTER + 6 + (GUTTER - 10) / 2}
            y={targetTop + 4}
            textAnchor="middle"
            className="fill-slate-600 text-[10px] font-semibold tabular-nums dark:fill-slate-300"
          >
            {formatNumber(targetMl)}
          </text>
        </g>
      </svg>

      <ol className="flex gap-0.5 pr-[8.7%]">
        {days.map((day, index) => (
          <li
            key={day.date}
            className={`flex min-w-0 flex-1 flex-col items-center leading-tight ${
              day.date === today
                ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="text-[10px] uppercase opacity-70">
              {WEEKDAY_INITIALS[weekdayIndex(day.date)]}
            </span>
            <span
              className={`text-xs tabular-nums ${
                active === index ? 'text-slate-900 dark:text-slate-100' : ''
              }`}
            >
              {Number(day.date.slice(8, 10))}
            </span>
          </li>
        ))}
      </ol>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-1.5 pr-4 font-medium">Day</th>
                <th scope="col" className="py-1.5 pr-4 font-medium">Water</th>
                <th scope="col" className="py-1.5 font-medium">Against target</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-1.5 pr-4">{label(day.date, today)}</td>
                  {/* No water is no water, whether or not the rest of that day
                      was filled in. "0 ml, 300 short" for a day nobody drank on
                      reads as a failure rather than a blank. */}
                  <td className="py-1.5 pr-4 tabular-nums">
                    {day.ml > 0 ? `${formatNumber(day.ml)} ml` : '—'}
                  </td>
                  <td className="py-1.5 tabular-nums">
                    {day.ml === 0
                      ? 'Nothing logged'
                      : day.ml >= targetMl
                        ? 'Met'
                        : `${formatNumber(targetMl - day.ml)} ml short`}
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

function weekdayIndex(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

function label(date: string, today: string): string {
  if (date === today) return 'Today'
  const value = new Date(`${date}T00:00:00Z`)
  return `${WEEKDAYS[value.getUTCDay()]} ${value.getUTCDate()}`
}

// Spelled out rather than formatted through Intl, for the same reason the diary
// does it: workerd and the browser ship different ICU builds.
const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const
