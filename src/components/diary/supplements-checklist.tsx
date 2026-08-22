'use client'

import Link from 'next/link'
import { useOptimistic, useTransition } from 'react'

import { toggleSupplement } from '@/lib/diary/actions'
import type { Supplement } from '@/lib/diary/queries'

const TIMING_LABELS = [
  { key: 'take_morning', label: 'morning' },
  { key: 'take_daytime', label: 'daytime' },
  { key: 'take_evening', label: 'evening' },
] as const

export function SupplementsChecklist({
  date,
  supplements,
  takenIds,
}: {
  date: string
  supplements: Supplement[]
  takenIds: string[]
}) {
  const [, startTransition] = useTransition()

  // Ticking a box should feel instant; the write catches up behind it.
  const [optimisticTaken, setOptimisticTaken] = useOptimistic(
    takenIds,
    (current: string[], change: { id: string; taken: boolean }) =>
      change.taken
        ? [...current, change.id]
        : current.filter((id) => id !== change.id),
  )

  function toggle(id: string, taken: boolean) {
    startTransition(async () => {
      setOptimisticTaken({ id, taken })
      await toggleSupplement(date, id, taken)
    })
  }

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <header className="mb-4 flex flex-col gap-0.5">
        <h2 className="font-semibold">
          Supplements
          {/* Nothing to answer until there is a list to answer about. */}
          {supplements.length > 0 ? (
            <>
              <span aria-hidden className="ml-0.5 text-red-500">*</span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tick off what you took from your regular list.
        </p>
      </header>

      {supplements.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No regular supplements yet.{' '}
          <Link
            href="/supplements"
            className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Add your first
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {supplements.map((supplement) => {
            const taken = optimisticTaken.includes(supplement.id)
            const timings = TIMING_LABELS.filter((t) => supplement[t.key]).map(
              (t) => t.label,
            )

            return (
              <li key={supplement.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    taken
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-black/10 hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={taken}
                    onChange={(event) => toggle(supplement.id, event.target.checked)}
                    className="mt-0.5 size-4 accent-emerald-600"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{supplement.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {[supplement.dose, timings.join(', ')].filter(Boolean).join(' · ') ||
                        'As prescribed'}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
