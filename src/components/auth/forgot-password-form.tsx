'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { requestPasswordReset } from '@/lib/auth/actions'
import { idleFormState } from '@/lib/forms'

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, idleFormState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage>{state.message}</FormMessage>

      <Field label="Email address" htmlFor="email" errors={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </Field>

      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        <Link
          href="/login"
          className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
