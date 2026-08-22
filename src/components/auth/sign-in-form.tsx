'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { signIn } from '@/lib/auth/actions'
import { idleFormState } from '@/lib/forms'

export function SignInForm() {
  const [state, action] = useActionState(signIn, idleFormState)

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

      <Field label="Password" htmlFor="password" errors={state.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={Boolean(state.fieldErrors?.password)}
          required
        />
      </Field>

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        New here?{' '}
        <Link
          href="/signup"
          className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}
