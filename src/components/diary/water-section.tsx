'use client'

import { useActionState, useRef, useTransition } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { addDrink, removeDrink } from '@/lib/diary/actions'
import { idleSaveState } from '@/lib/diary/save-state'
import { formatNumber } from '@/lib/format'
import type { LogDrink } from '@/lib/diary/queries'

export function WaterSection({
  date,
  drinks,
  totalMl,
  targetMl,
}: {
  date: string
  drinks: LogDrink[]
  totalMl: number
  targetMl: number
}) {
  const [state, formAction, pending] = useActionState(addDrink, idleSaveState)
  const [removing, startRemoving] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const pct = Math.min(100, Math.round((totalMl / targetMl) * 100))
  const metGoal = totalMl >= targetMl

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <header className="mb-4 flex flex-col gap-0.5">
        <h2 className="font-semibold">Water &amp; drinks</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Everything you drink counts toward your target.
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-semibold tabular-nums">
            {formatNumber(totalMl)}{' '}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              / {formatNumber(targetMl)} ml
            </span>
          </span>
          {metGoal ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              Goal met
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {(formatNumber(targetMl - totalMl))} ml to go
            </span>
          )}
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
          role="progressbar"
          aria-valuenow={totalMl}
          aria-valuemin={0}
          aria-valuemax={targetMl}
          aria-label="Water drunk today"
        >
          <div
            className="h-full rounded-full bg-emerald-600 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {drinks.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-1.5">
          {drinks.map((drink) => (
            <li
              key={drink.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-white/5"
            >
              <span className="font-medium">{drink.kind || 'Water'}</span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums text-slate-600 dark:text-slate-300">
                  {drink.volume_ml} ml
                </span>
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => startRemoving(() => void removeDrink(drink.id, date))}
                  className="rounded-md px-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40"
                  aria-label={`Remove ${drink.kind || 'drink'}, ${drink.volume_ml} ml`}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Nothing logged yet today.
        </p>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="date" value={date} />
        {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field label="Drink" htmlFor="kind">
            <Input id="kind" name="kind" placeholder="Water, herbal tea…" defaultValue="Water" />
          </Field>

          <Field label="Volume (ml)" htmlFor="volumeMl">
            <Input
              id="volumeMl"
              name="volumeMl"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="250"
              className="sm:w-32"
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
    </section>
  )
}
