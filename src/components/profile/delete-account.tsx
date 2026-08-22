'use client'

import { useActionState, useState } from 'react'

import { Field, FormMessage, Input } from '@/components/form-fields'
import { deleteAccount } from '@/lib/client/account'
import { idleFormState } from '@/lib/forms'

export function DeleteAccount({ fullName }: { fullName: string }) {
  const [state, action] = useActionState(deleteAccount, idleFormState)
  // Kept behind a deliberate second step, so it is never one stray tap away.
  const [open, setOpen] = useState(false)

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-red-500/30 p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold text-red-700 dark:text-red-400">Delete account</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Removes your profile, every diary entry, your measurements, supplements
          and messages. This cannot be undone.
        </p>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-fit rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Delete my account
        </button>
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <FormMessage>{state.message}</FormMessage>

          <Field
            label={`Type "${fullName}" to confirm`}
            htmlFor="confirmName"
            errors={state.fieldErrors?.confirmName}
          >
            <Input
              id="confirmName"
              name="confirmName"
              autoComplete="off"
              placeholder={fullName}
              invalid={Boolean(state.fieldErrors?.confirmName)}
              required
            />
          </Field>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete permanently
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
            >
              Keep my account
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
