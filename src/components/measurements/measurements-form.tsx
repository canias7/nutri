'use client'

import { useActionState, useRef, useState } from 'react'

import { BodyMap } from '@/components/measurements/body-map'
import { Field, FormMessage, Input, Textarea } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { LengthInput } from '@/components/units/length-input'
import { saveMeasurements } from '@/lib/client/measurements'
import { SITES, siteColumn } from '@/lib/client/measurement-sites'
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

  // Last time's numbers are the sensible starting point — most barely move, and
  // retyping nine unchanged values is how people stop bothering.
  const previous = (column: string): number | null => {
    const value = latest?.[column as keyof Measurement]
    return typeof value === 'number' ? value : value === null || value === undefined ? null : Number(value)
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

        {/* No weight here: the diary asks for it every morning, and the
            starting weight sits further up this same page. */}
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
            max={today}
            invalid={Boolean(state.fieldErrors?.measuredOn)}
            required
            className="sm:w-52"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          {SITES.map((site) => (
            <Field key={site.name} label={site.label} htmlFor={site.name}>
              <LengthInput
                id={site.name}
                name={site.name}
                storedValue={previous(siteColumn(site.name))}
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
