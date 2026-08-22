'use client'

import { useActionState } from 'react'

import { Field, FormMessage, Input, Textarea } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { linkCoach, updateProfile } from '@/lib/client/profile'
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

export function CoachLinkForm({ coachName }: { coachName: string | null }) {
  const [state, action] = useActionState(linkCoach, idleFormState)

  if (coachName && state.status === 'idle' && !state.message) {
    return (
      <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="mb-1 font-semibold">Your nutritionist</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You are linked to{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {coachName}
          </span>
          . They can read your diary and write your recommendations.
        </p>
      </div>
    )
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-2xl border border-black/10 p-5 dark:border-white/10"
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold">Your nutritionist</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {coachName
            ? 'Entering a new code moves your diary to a different specialist.'
            : 'Not linked yet. Enter the code your specialist gave you.'}
        </p>
      </div>

      {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}
      <Saved message={state.status === 'idle' ? state.message : undefined} />

      <Field label="Invite code" htmlFor="inviteCode" errors={state.fieldErrors?.inviteCode}>
        <Input
          id="inviteCode"
          name="inviteCode"
          placeholder="e.g. morgan_coach"
          defaultValue={state.values?.inviteCode}
          invalid={Boolean(state.fieldErrors?.inviteCode)}
          spellCheck={false}
          autoCapitalize="none"
        />
      </Field>

      <SubmitButton pendingLabel="Linking…" variant="ghost">
        Link my diary
      </SubmitButton>
    </form>
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

          <Field label="Height (cm)" htmlFor="heightCm" errors={errors('heightCm')}>
            <Input
              id="heightCm"
              name="heightCm"
              type="number"
              inputMode="decimal"
              step="0.5"
              defaultValue={value('heightCm', client.height_cm)}
              invalid={Boolean(errors('heightCm'))}
            />
          </Field>

          <Field
            label="Starting weight (kg)"
            htmlFor="startWeightKg"
            hint="Your baseline — progress is measured against it."
            errors={errors('startWeightKg')}
          >
            <Input
              id="startWeightKg"
              name="startWeightKg"
              type="number"
              inputMode="decimal"
              step="0.1"
              defaultValue={value('startWeightKg', client.start_weight_kg)}
              invalid={Boolean(errors('startWeightKg'))}
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
