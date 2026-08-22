'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Jump straight to a day. Stepping back one arrow at a time is fine for
 * yesterday and useless for "the Tuesday before last", which is exactly when
 * people are catching up on a diary they forgot.
 */
export function DateJump({ date, today }: { date: string; today: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
      >
        Log another day
      </button>
    )
  }

  return (
    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
      <span>Go to</span>
      <input
        type="date"
        defaultValue={date}
        max={today}
        autoFocus
        onChange={(event) => {
          const next = event.target.value
          if (next) router.push(`/diary/${next}`)
        }}
        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-100"
      />
    </label>
  )
}
