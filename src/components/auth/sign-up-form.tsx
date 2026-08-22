'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { signUp } from '@/lib/auth/actions'
import { idleFormState } from '@/lib/forms'

const ROLES = [
  {
    value: 'client',
    title: 'I want to be coached',
    detail: 'Keep a daily diary your nutritionist reviews.',
  },
  {
    value: 'nutritionist',
    title: 'I am a nutritionist',
    detail: 'Follow your clients and write their recommendations.',
  },
] as const

export function SignUpForm() {
  const [state, action] = useActionState(signUp, idleFormState)
  const [role, setRole] = useState<string>(state.values?.role ?? 'client')

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage>{state.message}</FormMessage>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Register as
        </legend>
        <div className="flex flex-col gap-2">
          {ROLES.map((option) => {
            const selected = role === option.value
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-black/10 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={selected}
                  onChange={() => setRole(option.value)}
                  className="mt-0.5 size-4 accent-emerald-600"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {option.title}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {option.detail}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

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
