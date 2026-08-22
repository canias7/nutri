'use client'

import type { ReactNode } from 'react'

import { useActionState, useTransition } from 'react'

import { DiaryRow } from '@/components/diary/diary-row'
import { Field, FormMessage, Input } from '@/components/form-fields'
import { addRestroomVisit, removeRestroomVisit } from '@/lib/diary/actions'
import { idleSaveState } from '@/lib/diary/save-state'
import type { SectionNeed } from '@/lib/diary/completeness'
import type { LogStool } from '@/lib/diary/queries'

/**
 * How many times, and when.
 *
 * A row per visit rather than a number in a box: the count is the length of the
 * list, so it can never drift from the times underneath it, and a visit added at
 * three in the afternoon does not mean re-reading and re-typing a total.
 *
 * The time is optional on purpose. Someone remembering at bedtime that it
 * happened twice should be able to say so; insisting on a time they no longer
 * know is how a day ends up with nothing recorded at all.
 */
export function RestroomSection({
  date,
  visits,
  need,
  summary,
}: {
  date: string
  visits: LogStool[]
  need: SectionNeed
  summary?: ReactNode
}) {
  const [state, formAction, pending] = useActionState(addRestroomVisit, idleSaveState)
  const [removing, startRemoving] = useTransition()

  return (
    <DiaryRow title="Restroom" need={need} summary={summary}>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        How many times, and roughly when. Unglamorous, and one of the most useful
        things your nutritionist gets.
      </p>

      {visits.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-1.5">
          {visits.map((visit) => (
            <li
              key={visit.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-white/5"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium tabular-nums">
                  {visit.occurred_at ? visit.occurred_at.slice(0, 5) : 'Time not noted'}
                </span>
                {visit.notes ? (
                  <span className="text-slate-600 dark:text-slate-300">{visit.notes}</span>
                ) : null}
              </span>

              <button
                type="button"
                disabled={removing}
                onClick={() => startRemoving(() => void removeRestroomVisit(visit.id, date))}
                className="rounded-md px-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40"
                aria-label={`Remove the visit at ${
                  visit.occurred_at ? visit.occurred_at.slice(0, 5) : 'an unrecorded time'
                }`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Nothing logged yet today.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="date" value={date} />
        {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}

        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
          <Field label="Time" htmlFor="occurredAt">
            <Input id="occurredAt" name="occurredAt" type="time" className="sm:w-32" />
          </Field>

          <Field label="Notes" htmlFor="notes">
            <Input
              id="notes"
              name="notes"
              placeholder="Formed, soft, urgency, discomfort…"
            />
          </Field>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
            >
              {pending ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      </form>
    </DiaryRow>
  )
}
