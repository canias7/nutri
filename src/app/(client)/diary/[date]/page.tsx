import type { Metadata } from 'next'
import Link from 'next/link'

import {
  ComplaintsSection,
  DaytimeSection,
  EveningSection,
  ExtraSupplementsSection,
  MorningSection,
} from '@/components/diary/sections'
import { DateJump } from '@/components/diary/date-jump'
import { DayDiscussion } from '@/components/diary/day-discussion'
import { FoodSection } from '@/components/diary/food-section'
import { SupplementsChecklist } from '@/components/diary/supplements-checklist'
import { WaterSection } from '@/components/diary/water-section'
import { WeekStrip } from '@/components/diary/week-strip'
import { requireClient } from '@/lib/auth/session'
import { isValidDateParam } from '@/lib/diary/date'
import { resolveToday } from '@/lib/diary/today'
import { getDayComments, getDiaryDay } from '@/lib/diary/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Diary · nutri' }

export default async function DiaryPage({ params }: PageProps<'/diary/[date]'>) {
  const { date } = await params

  // Rendered inline rather than through notFound(). This segment streams behind
  // its loading skeleton, so by the time notFound() could fire the response has
  // already gone out as a 200 — the reader gets a broken suspense boundary
  // instead of an answer. A mistyped or stale date is best answered with a way
  // back, not an error.
  if (!isValidDateParam(date)) {
    return <InvalidDate value={date} />
  }

  const { viewer, client } = await requireClient()
  const [day, today] = await Promise.all([
    getDiaryDay(viewer.id, date),
    resolveToday(),
  ])

  const [comments, coachName] = await Promise.all([
    day.log ? getDayComments(day.log.id, viewer.id) : Promise.resolve([]),
    getCoachName(client.nutritionist_id),
  ])
  const hasUnread = comments.some((comment) => !comment.mine)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <WeekStrip date={date} today={today} />

        {/* The strip only reaches back a week. Catching up on a fortnight ago
            needs a way out of it that is not thirteen taps of an arrow. */}
        <div className="flex justify-center">
          <DateJump date={date} today={today} />
        </div>
      </header>

      <MorningSection date={date} log={day.log} />

      <WaterSection
        date={date}
        drinks={day.drinks}
        totalMl={day.log?.water_total_ml ?? 0}
        targetMl={client.water_target_ml}
      />

      <FoodSection date={date} meals={day.meals} />

      <DaytimeSection date={date} log={day.log} />

      <SupplementsChecklist
        date={date}
        supplements={day.supplements}
        takenIds={day.takenSupplementIds}
      />
      <ExtraSupplementsSection date={date} log={day.log} />

      <EveningSection date={date} log={day.log} />

      <ComplaintsSection date={date} log={day.log} />

      <DayDiscussion
        date={date}
        dailyLogId={day.log?.id ?? null}
        comments={comments}
        coachName={coachName}
        hasUnread={hasUnread}
      />

      <p className="pb-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Everything saves as you type. Come back through the day.
      </p>
    </div>
  )
}

async function getCoachName(nutritionistId: string | null): Promise<string | null> {
  if (!nutritionistId) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', nutritionistId)
    .maybeSingle()
  return data?.full_name || null
}

function InvalidDate({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-start gap-3 py-8">
      <h1 className="text-xl font-semibold tracking-tight">That isn&apos;t a date</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        <span className="font-mono">{value.slice(0, 40)}</span> is not a day we can
        open. Dates look like 2026-08-22.
      </p>
      <div className="flex gap-2">
        <Link
          href="/diary"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Today&apos;s diary
        </Link>
        <Link
          href="/history"
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
        >
          Pick from history
        </Link>
      </div>
    </div>
  )
}
