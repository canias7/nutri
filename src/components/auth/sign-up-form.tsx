'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { signUp } from '@/lib/auth/actions'
import { idleFormState } from '@/lib/forms'

export function SignUpForm() {
  const [state, action] = useActionState(signUp, idleFormState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage>{state.message}</FormMessage>

      <Field label="Your full name" htmlFor="fullName" errors={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Alex Morgan"
          defaultValue={state.values?.fullName}
          invalid={Boolean(state.fieldErrors?.fullName)}
          required
        />
      </Field>

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

      <Field
        label="Password"
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

      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
