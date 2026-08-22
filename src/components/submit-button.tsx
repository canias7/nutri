'use client'

import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
}: {
  children: ReactNode
  pendingLabel?: string
  variant?: 'primary' | 'ghost'
}) {
  const { pending } = useFormStatus()

  const base =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] ' +
    'font-semibold transition disabled:cursor-not-allowed disabled:opacity-60'

  const look =
    variant === 'primary'
      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800'
      : 'border border-black/10 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'

  return (
    <button type="submit" disabled={pending} className={`${base} ${look}`}>
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? 'Working…'}
        </>
      ) : (
        children
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  )
}
