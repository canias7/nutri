'use client'

import { useActionState } from 'react'

import { Field, FormMessage, Input, Textarea } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { LengthInput } from '@/components/units/length-input'
import { WeightInput } from '@/components/units/weight-input'
import { updateProfile } from '@/lib/client/profile'
import { idleFormState } from '@/lib/forms'
import type { ClientRow } from '@/lib/auth/session'

type Complaints = {
  emotional?: string
  digestion?: string
  skin?: string
  other?: string
}

function Saved({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="status"
      className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      {message}
    </p>
  )
}

/**
 * Who reads this diary. There is one nutritionist for the whole practice, so
 * this is a statement rather than a choice — every client is attached to them
 * on sign-up, and there was never a second specialist to pick between.
 */
export function CoachCard({ coachName }: { coachName: string | null }) {
  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <h2 className="mb-1 font-semibold">Your nutritionist</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {coachName ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {coachName}
            </span>{' '}
            reads your diary and writes your recommendations.
          </>
        ) : (
          'Your diary is being read as soon as there is somebody on the other end. Keep logging in the meantime — nothing is lost.'
        )}
      </p>
    </div>
  )
}

export function ProfileForm({
  fullName,
  client,
}: {
  fullName: string
  client: ClientRow
}) {
  const [state, action] = useActionState(updateProfile, idleFormState)
  const complaints = (client.initial_complaints ?? {}) as Complaints

  const value = (name: string, fallback: string | number | null | undefined) =>
    state.values?.[name] ?? (fallback === null || fallback === undefined ? '' : String(fallback))
  const errors = (name: string) => state.fieldErrors?.[name]

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}
      <Saved message={state.status === 'idle' ? state.message : undefined} />

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="font-semibold">About you</h2>

        <Field label="Your name" htmlFor="fullName" errors={errors('fullName')}>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={value('fullName', fullName)}
            invalid={Boolean(errors('fullName'))}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Age (years)" htmlFor="age" errors={errors('age')}>
            <Input
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              defaultValue={value('age', client.age)}
              invalid={Boolean(errors('age'))}
            />
          </Field>

          <Field label="Gender" htmlFor="gender" errors={errors('gender')}>
            <Input id="gender" name="gender" defaultValue={value('gender', client.gender)} />
          </Field>

          <Field label="Height" htmlFor="heightCm" errors={errors('heightCm')}>
            <LengthInput
              id="heightCm"
              name="heightCm"
              storedValue={client.height_cm}
            />
          </Field>

          <Field
            label="Starting weight"
            htmlFor="startWeightKg"
            hint="Your baseline — progress is measured against it."
            errors={errors('startWeightKg')}
          >
            <WeightInput
              id="startWeightKg"
              name="startWeightKg"
              storedValue={client.start_weight_kg}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="font-semibold">Your goal</h2>

        <Field label="Main program goal" htmlFor="goal" errors={errors('goal')}>
          <Textarea
            id="goal"
            name="goal"
            defaultValue={value('goal', client.goal)}
            invalid={Boolean(errors('goal'))}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target date" htmlFor="goalDeadline" errors={errors('goalDeadline')}>
            <Input
              id="goalDeadline"
              name="goalDeadline"
              type="date"
              defaultValue={value('goalDeadline', client.goal_deadline)}
            />
          </Field>

          <Field
            label="Daily water target (ml)"
            htmlFor="waterTargetMl"
            errors={errors('waterTargetMl')}
          >
            <Input
              id="waterTargetMl"
              name="waterTargetMl"
              type="number"
              inputMode="numeric"
              step="50"
              defaultValue={value('waterTargetMl', client.water_target_ml)}
              invalid={Boolean(errors('waterTargetMl'))}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold">How you felt at the start</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your baseline. Worth leaving as written — it is what later progress is
            compared against.
          </p>
        </div>

        <Field label="Emotional state & sleep" htmlFor="complaintEmotional">
          <Textarea
            id="complaintEmotional"
            name="complaintEmotional"
            defaultValue={value('complaintEmotional', complaints.emotional)}
          />
        </Field>

        <Field label="Digestion & gut" htmlFor="complaintDigestion">
          <Textarea
            id="complaintDigestion"
            name="complaintDigestion"
            defaultValue={value('complaintDigestion', complaints.digestion)}
          />
        </Field>

        <Field label="Skin, hair & nails" htmlFor="complaintSkin">
          <Textarea
            id="complaintSkin"
            name="complaintSkin"
            defaultValue={value('complaintSkin', complaints.skin)}
          />
        </Field>

        <Field label="Anything else" htmlFor="complaintOther">
          <Textarea
            id="complaintOther"
            name="complaintOther"
            defaultValue={value('complaintOther', complaints.other)}
          />
        </Field>
      </section>

      <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  )
}
