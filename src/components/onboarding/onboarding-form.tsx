'use client'

import { useActionState } from 'react'
import type { ReactNode } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { LengthInput } from '@/components/units/length-input'
import { UnitToggle } from '@/components/units/unit-provider'
import { WeightInput } from '@/components/units/weight-input'
import { completeOnboarding } from '@/lib/client/actions'
import { idleFormState } from '@/lib/forms'

export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, idleFormState)
  const value = (name: string) => state.values?.[name]
  const errors = (name: string) => state.fieldErrors?.[name]

  return (
    <form action={action} className="flex flex-col gap-7">
      <FormMessage>{state.message}</FormMessage>

      <Section
        title="Biometrics"
        description="Your specialist needs these to work out individual targets."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age (years)" htmlFor="age" errors={errors('age')}>
            <Input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={1}
              max={130}
              placeholder="34"
              defaultValue={value('age')}
              invalid={Boolean(errors('age'))}
            />
          </Field>

          <Field label="Gender" htmlFor="gender" errors={errors('gender')}>
            <Input
              id="gender"
              name="gender"
              placeholder="However you describe it"
              defaultValue={value('gender')}
              invalid={Boolean(errors('gender'))}
            />
          </Field>

          <Field label="Height" htmlFor="heightCm" errors={errors('heightCm')}>
            <LengthInput id="heightCm" name="heightCm" placeholder="172" />
          </Field>

          <Field
            label="Starting weight"
            htmlFor="startWeightKg"
            errors={errors('startWeightKg')}
          >
            <WeightInput id="startWeightKg" name="startWeightKg" placeholder="70.5" />
          </Field>
        </div>

        {/* Offered here rather than buried in settings: this is the first time
            anyone is asked for a height, and asking in the wrong unit is how a
            form gets abandoned. */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Enter height and weight in
          </span>
          <UnitToggle />
        </div>
      </Section>

      <SubmitButton pendingLabel="Setting up…">Start my program</SubmitButton>
    </form>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  )
}
