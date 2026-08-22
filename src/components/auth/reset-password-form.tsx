'use client'

import { useActionState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { resetPassword } from '@/lib/auth/actions'
import { idleFormState } from '@/lib/forms'

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, idleFormState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage>{state.message}</FormMessage>

      <Field
        label="New password"
        htmlFor="password"
        hint="At least 6 characters."
        errors={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={Boolean(state.fieldErrors?.password)}
          required
        />
      </Field>

      <Field label="Type it again" htmlFor="confirm" errors={state.fieldErrors?.confirm}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          invalid={Boolean(state.fieldErrors?.confirm)}
          required
        />
      </Field>

      <SubmitButton pendingLabel="Saving…">Set new password</SubmitButton>
    </form>
  )
}
