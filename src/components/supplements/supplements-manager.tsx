'use client'

import { useActionState, useRef, useTransition } from 'react'
import { useEffect } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import {
  addSupplement,
  removeSupplement,
  restoreSupplement,
} from '@/lib/client/supplements'
import { idleFormState } from '@/lib/forms'
import type { Supplement } from '@/lib/diary/queries'

const TIMINGS = [
  { name: 'takeMorning', key: 'take_morning', label: 'Morning' },
  { name: 'takeDaytime', key: 'take_daytime', label: 'Daytime' },
  { name: 'takeEvening', key: 'take_evening', label: 'Evening' },
] as const

export function SupplementsManager({
  active,
  retired,
}: {
  active: Supplement[]
  retired: Supplement[]
}) {
  const [state, formAction] = useActionState(addSupplement, idleFormState)
  const [busy, startBusy] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the form once the row lands, so adding several in a row is quick.
  useEffect(() => {
    if (state.status === 'idle' && !state.fieldErrors && !state.message) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Your list
        </h2>

        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
            Nothing yet. Add the first one below and it will appear as a checkbox
            in your daily log.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {active.map((supplement) => {
              const timings = TIMINGS.filter((t) => supplement[t.key]).map((t) => t.label)

              return (
                <li
                  key={supplement.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-3 dark:border-white/10"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{supplement.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {[supplement.dose, timings.join(', ')].filter(Boolean).join(' · ') ||
                        'As prescribed'}
                    </span>
                  </span>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startBusy(() => void removeSupplement(supplement.id))}
                    className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-950/40"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="font-semibold">Add a supplement</h2>

        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <FormMessage>{state.message}</FormMessage>

          <Field label="Name" htmlFor="name" errors={state.fieldErrors?.name}>
            <Input
              id="name"
              name="name"
              placeholder="Magnesium glycinate"
              invalid={Boolean(state.fieldErrors?.name)}
              required
            />
          </Field>

          <Field
            label="Dose"
            htmlFor="dose"
            hint="Optional — whatever you need to remember."
            errors={state.fieldErrors?.dose}
          >
            <Input id="dose" name="dose" placeholder="400 mg, 1 capsule" />
          </Field>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              When you take it
            </legend>
            <div className="flex flex-wrap gap-4">
              {TIMINGS.map((timing) => (
                <label
                  key={timing.name}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <input
                    type="checkbox"
                    name={timing.name}
                    className="size-4 accent-emerald-600"
                  />
                  {timing.label}
                </label>
              ))}
            </div>
          </fieldset>

          <SubmitButton pendingLabel="Adding…">Add to my list</SubmitButton>
        </form>
      </section>

      {retired.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            No longer taking
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kept so your past logs still say what you were on at the time.
          </p>
          <ul className="flex flex-col gap-1.5">
            {retired.map((supplement) => (
              <li
                key={supplement.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-2.5 text-sm dark:border-white/10"
              >
                <span className="text-slate-500 dark:text-slate-400">{supplement.name}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startBusy(() => void restoreSupplement(supplement.id))}
                  className="rounded-lg px-2.5 py-1 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                >
                  Taking again
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
