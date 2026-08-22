'use client'

import { useActionState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { setInviteCode } from '@/lib/coach/actions'
import { idleFormState } from '@/lib/forms'

export function InviteCodeForm({ current }: { current: string | null }) {
  const [state, action] = useActionState(setInviteCode, idleFormState)
  const saved = state.status === 'idle' && state.message

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.status === 'error' ? <FormMessage>{state.message}</FormMessage> : null}

      {saved ? (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          {state.message}
        </p>
      ) : null}

      <Field
        label="Your invite code"
        htmlFor="inviteCode"
        hint="Clients type this to link their diary to you. Make it memorable."
        errors={state.fieldErrors?.inviteCode}
      >
        <Input
          id="inviteCode"
          name="inviteCode"
          placeholder="e.g. morgan_coach"
          defaultValue={state.values?.inviteCode ?? current ?? ''}
          invalid={Boolean(state.fieldErrors?.inviteCode)}
          spellCheck={false}
          autoCapitalize="none"
          required
        />
      </Field>

      <SubmitButton pendingLabel="Saving…">
        {current ? 'Update invite code' : 'Save invite code'}
      </SubmitButton>
    </form>
  )
}
