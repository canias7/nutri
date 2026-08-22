'use client'

import { useActionState, useTransition } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { addStool, removeStool } from '@/lib/diary/actions'
import { idleSaveState } from '@/lib/diary/save-state'
import type { LogStool } from '@/lib/diary/queries'

export function StoolSection({
  date,
  stools,
}: {
  date: string
  stools: LogStool[]
}) {
  const [state, formAction, pending] = useActionState(addStool, idleSaveState)
  const [removing, startRemoving] = useTransition()

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <header className="mb-4 flex flex-col gap-0.5">
        <h2 className="font-semibold">Bowel movements</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Unglamorous, and one of the most useful things your nutritionist gets.
        </p>
      </header>

      {stools.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-1.5">
          {stools.map((stool) => (
            <li
              key={stool.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-white/5"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium tabular-nums">
                  {stool.occurred_at ? stool.occurred_at.slice(0, 5) : 'Time not noted'}
                </span>
                {stool.notes ? (
                  <span className="text-slate-600 dark:text-slate-300">{stool.notes}</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={removing}
                onClick={() => startRemoving(() => void removeStool(stool.id, date))}
                className="rounded-md px-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40"
                aria-label="Remove record"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          No records for this day.
        </p>
      )}

      <form action={formAction} className="grid gap-3 sm:grid-cols-[auto_1fr_auto]">
        <input type="hidden" name="date" value={date} />
        {state.status === 'error' ? (
          <div className="sm:col-span-3">
            <FormMessage>{state.message}</FormMessage>
          </div>
        ) : null}

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
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto dark:border-white/15 dark:hover:bg-white/5"
          >
            {pending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </section>
  )
}
