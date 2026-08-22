import type { Metadata } from 'next'
import Link from 'next/link'


import {
  ComplaintsSection,
  DaytimeSection,
  EveningSection,
  ExtraSupplementsSection,
  MealSection,
  MorningSection,
} from '@/components/diary/sections'
import { DateJump } from '@/components/diary/date-jump'
import { DayDiscussion } from '@/components/diary/day-discussion'
import { DayPoster } from '@/components/diary/day-poster'
import { StoolSection } from '@/components/diary/stool-section'
import { SupplementsChecklist } from '@/components/diary/supplements-checklist'
import { WaterSection } from '@/components/diary/water-section'
import { requireClient } from '@/lib/auth/session'
import {
  addDays,
  formatLongDate,
  isValidDateParam
} from '@/lib/diary/date'
 import { resolveToday } from '@/lib/diary/today'
import {
  completedSections,
  getDayComments,
  getDiaryDay,
  MEAL_SLOTS,
  SECTION_LABELS,
  type SectionKey,
} from '@/lib/diary/queries'
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

  const done = completedSections(day)
  const mealsBySlot = new Map(day.meals.map((meal) => [meal.slot, meal]))
  const isToday = date === today
  const isFuture = date > today

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/diary/${addDays(date, -1)}`}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            ← Previous
          </Link>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-semibold tracking-tight">
              {isToday ? 'Today' : formatLongDate(date)}
            </h1>
            {isToday ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatLongDate(date)}
              </span>
            ) : null}
          </div>

          {isToday ? (
            <span className="px-2 py-1 text-sm text-transparent select-none" aria-hidden>
              Next
            </span>
          ) : (
            <Link
              href={`/diary/${addDays(date, 1)}`}
              className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            >
              Next →
            </Link>
          )}
        </div>

        {isFuture ? (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            This day hasn&apos;t happened yet. You can still make notes, but weight
            and water are best logged as they happen.
          </p>
        ) : null}

        <div className="flex justify-center">
          <DateJump date={date} today={today} />
        </div>

        <Progress done={done} />
      </header>

      <MorningSection date={date} log={day.log} />

      <WaterSection
        date={date}
        drinks={day.drinks}
        totalMl={day.log?.water_total_ml ?? 0}
        targetMl={client.water_target_ml}
      />

      {MEAL_SLOTS.map((meal) => (
        <MealSection
          key={meal.slot}
          date={date}
          slot={meal.slot}
          label={meal.label}
          defaultTime={meal.defaultTime}
          meal={mealsBySlot.get(meal.slot)}
        />
      ))}

      <StoolSection date={date} stools={day.stools} />

      <DaytimeSection date={date} log={day.log} />

      <SupplementsChecklist
        date={date}
        supplements={day.supplements}
        takenIds={day.takenSupplementIds}
      />
      <ExtraSupplementsSection date={date} log={day.log} />

      <EveningSection date={date} log={day.log} />

      <ComplaintsSection date={date} log={day.log} />

      <DayPoster
        data={{
          dateLabel: formatLongDate(date),
          name: viewer.profile.full_name,
          weightKg: day.log?.weight_kg ? Number(day.log.weight_kg) : null,
          waterMl: day.log?.water_total_ml ?? 0,
          waterTargetMl: client.water_target_ml,
          energy: day.log?.energy_level ?? null,
          stress: day.log?.stress_level ?? null,
          sectionsDone: done.size,
          sectionsTotal: Object.keys(SECTION_LABELS).length,
          meals: MEAL_SLOTS.map((meal) => ({
            label: meal.label,
            eaten: mealsBySlot.get(meal.slot)?.eaten ?? '',
          })),
        }}
      />

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

function Progress({ done }: { done: Set<SectionKey> }) {
  const keys = Object.keys(SECTION_LABELS) as SectionKey[]
  const count = keys.filter((key) => done.has(key)).length

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Filled in
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {count} of {keys.length}
        </span>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {keys.map((key) => {
          const complete = done.has(key)
          return (
            <li
              key={key}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                complete
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
              }`}
            >
              {complete ? '✓ ' : ''}
              {SECTION_LABELS[key]}
            </li>
          )
        })}
      </ul>
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
