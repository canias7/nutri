'use client'

import { useActionState, useRef, useState } from 'react'

import { BodyMap } from '@/components/measurements/body-map'
import { SITES, siteColumn } from '@/lib/client/measurement-sites'
import { Field, FormMessage, Input, Textarea } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { saveMeasurements } from '@/lib/client/measurements'
import { idleFormState } from '@/lib/forms'
import type { Tables } from '@/lib/supabase/database.types'

type Measurement = Tables<'body_measurements'>

export function MeasurementsForm({
  today,
  latest,
}: {
  today: string
  latest: Measurement | null
}) {
  const [state, action] = useActionState(saveMeasurements, idleFormState)
  const [active, setActive] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function focusSite(name: string) {
    setActive(name)
    const input = formRef.current?.querySelector<HTMLInputElement>(`#${name}`)
    input?.focus()
    input?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  // Last time's numbers are the sensible starting point — most of them barely
  // move, and retyping nine unchanged values is how people stop bothering.
  const previous = (name: string) => {
    const value = latest?.[name as keyof Measurement]
    return value === null || value === undefined ? '' : String(value)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <p className="mb-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Tap a point to jump to that measurement.
        </p>
        <BodyMap active={active} onSelect={focusSite} />
      </div>

      <form ref={formRef} action={action} className="flex flex-col gap-5">
        {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}
        {state.status === 'idle' && state.message ? (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {state.message}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Date measured"
            htmlFor="measuredOn"
            errors={state.fieldErrors?.measuredOn}
          >
            <Input
              id="measuredOn"
              name="measuredOn"
              type="date"
              defaultValue={today}
              invalid={Boolean(state.fieldErrors?.measuredOn)}
              required
            />
          </Field>

          <Field label="Weight (kg)" htmlFor="weightKg">
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="70.5"
              defaultValue={previous('weight_kg')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SITES.map((site) => (
            <Field key={site.name} label={`${site.label} (cm)`} htmlFor={site.name}>
              <Input
                id={site.name}
                name={site.name}
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="—"
                defaultValue={previous(siteColumn(site.name))}
                onFocus={() => setActive(site.name)}
                onBlur={() => setActive(null)}
              />
            </Field>
          ))}
        </div>

        <Field label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            name="notes"
            placeholder="Anything worth remembering about these numbers."
          />
        </Field>

        <SubmitButton pendingLabel="Saving…">Save measurements</SubmitButton>
      </form>
    </div>
  )
}
