'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import {
  addDays,
  formatDayMonth,
  weekdayName,
  weekOf,
  WEEKDAY_INITIALS,
} from '@/lib/diary/date'

/**
 * The week the day being read falls in, as seven dates.
 *
 * A diary is filled in across the last few days far more often than across the
 * last few months, so the week is what the picker shows; the arrows step one
 * day at a time and carry into the week either side. Days that have not
 * happened yet are shown but not reachable — there is nothing to log about
 * tomorrow.
 */
export function WeekStrip({ date, today }: { date: string; today: string }) {
  const week = weekOf(date)
  const canGoForward = date < today

  useMidnightRefresh(today)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-0.5">
        <h1 className="text-lg font-semibold tracking-tight">
          {date === today ? 'Today' : weekdayName(date)}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatDayMonth(date)}
        </p>
      </div>

      <nav
        aria-label="Pick a day"
        className="flex items-center gap-1 rounded-2xl border border-black/10 p-1.5 dark:border-white/10"
      >
        <Step href={`/diary/${addDays(date, -1)}`} label="Previous day" back />

        <ol className="flex min-w-0 flex-1 items-stretch gap-0.5">
          {week.map((day, index) => (
            <li key={day} className="min-w-0 flex-1">
              <Day day={day} index={index} viewed={date} today={today} />
            </li>
          ))}
        </ol>

        <Step
          href={canGoForward ? `/diary/${addDays(date, 1)}` : null}
          label="Next day"
        />
      </nav>
    </div>
  )
}

function Day({
  day,
  index,
  viewed,
  today,
}: {
  day: string
  index: number
  viewed: string
  today: string
}) {
  // The date param is fixed-width, so the day of the month is the last two
  // characters — no parsing, and no timezone to get wrong.
  const number = Number(day.slice(8, 10))
  const initial = WEEKDAY_INITIALS[index]
  const selected = day === viewed
  const isToday = day === today

  const inner = (
    <>
      <span className="text-[10px] font-medium uppercase opacity-70">{initial}</span>
      <span className="text-sm font-semibold tabular-nums">{number}</span>
    </>
  )

  if (day > today) {
    return (
      <span
        aria-disabled
        title="This day hasn't happened yet"
        className="flex h-11 cursor-not-allowed flex-col items-center justify-center rounded-xl text-slate-300 dark:text-slate-600"
      >
        {inner}
      </span>
    )
  }

  return (
    <Link
      href={`/diary/${day}`}
      aria-current={selected ? 'date' : undefined}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
    >
      <DayFace selected={selected} isToday={isToday}>
        {inner}
      </DayFace>
    </Link>
  )
}

/**
 * Split out so it can ask whether its own link is the one navigating. The day
 * fills in the moment it is tapped rather than after the round trip, which is
 * the difference between a picker that feels immediate and one that feels
 * broken.
 */
function DayFace({
  selected,
  isToday,
  children,
}: {
  selected: boolean
  isToday: boolean
  children: React.ReactNode
}) {
  const { pending } = useLinkStatus()
  const active = selected || pending

  return (
    <span
      className={`flex h-11 flex-col items-center justify-center rounded-xl transition ${
        active
          ? 'bg-emerald-600 text-white'
          : isToday
            ? 'text-emerald-700 ring-1 ring-inset ring-emerald-600/40 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </span>
  )
}

function Step({
  href,
  label,
  back,
}: {
  href: string | null
  label: string
  back?: boolean
}) {
  const path = back ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'

  const icon = (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  )

  // Kept in the layout when there is nowhere to go, so the week does not shift
  // sideways on the day it reaches today.
  if (!href) {
    return (
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-200 dark:text-slate-700"
      >
        {icon}
      </span>
    )
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
    >
      {icon}
    </Link>
  )
}

/**
 * A diary left open overnight would keep calling yesterday "Today".
 *
 * The date is resolved on the server from the browser's offset, so it only
 * moves on when something re-renders. This watches for the day turning over and
 * asks for a fresh render once — guarded by the date it fired for, so a
 * disagreement between the two clocks cannot become a refresh loop.
 */
function useMidnightRefresh(today: string) {
  const router = useRouter()
  const refreshedFor = useRef<string | null>(null)

  useEffect(() => {
    function check() {
      const now = new Date()
      const local = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-')

      if (local > today && refreshedFor.current !== local) {
        refreshedFor.current = local
        router.refresh()
      }
    }

    const timer = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [today, router])
}
