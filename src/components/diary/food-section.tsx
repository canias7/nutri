'use client'

import { useRef, useState } from 'react'

import { AutosaveSection, type AutosaveHandle } from '@/components/diary/autosave-section'
import { Field, Input, Textarea } from '@/components/form-fields'
import { MealPhotos } from '@/components/diary/meal-photos'
import { saveFood } from '@/lib/diary/actions'
import type { LogMeal } from '@/lib/diary/queries'

type Entry = {
  /** Stable across re-orders so an uncontrolled field keeps what was typed. */
  key: string
  eaten: string
  amount: string
  method: string
  eatenAt: string
  /** Object names in the bucket. Held in state, serialised into one field. */
  photoPaths: string[]
}

/** Times come back from Postgres as HH:MM:SS; the input wants HH:MM. */
function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : ''
}

const BLANK = { eaten: '', amount: '', method: '', eatenAt: '', photoPaths: [] as string[] }

function fromMeals(meals: LogMeal[]): Entry[] {
  if (meals.length === 0) return [{ key: 'blank', ...BLANK }]

  return meals.map((meal) => ({
    key: meal.id,
    eaten: meal.eaten,
    amount: meal.amount,
    method: meal.method,
    eatenAt: toTimeInput(meal.eaten_at),
    photoPaths: meal.photo_paths,
  }))
}

/**
 * Everything eaten in a day, as one section.
 *
 * The diary used to ask about five named meals and give each its own box.
 * Most days that meant four empty boxes and nowhere to put a sixth meal, so it
 * is one list now: an entry per thing eaten, added as the day goes.
 */
export function FoodSection({
  date,
  meals,
  clientId,
  photoUrls,
}: {
  date: string
  meals: LogMeal[]
  /** The upload path starts with this; the storage rules key on it. */
  clientId: string
  /** Short-lived signed URLs for the photos already on file, by object name. */
  photoUrls: Record<string, string>
}) {

  const [entries, setEntries] = useState<Entry[]>(() => fromMeals(meals))
  const added = useRef(0)
  const section = useRef<AutosaveHandle>(null)

  function add() {
    added.current += 1
    setEntries((current) => [...current, { key: `added-${added.current}`, ...BLANK }])
  }

  function setPhotos(key: string, photoPaths: string[]) {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, photoPaths } : entry)),
    )
    // The path lives in state, so nothing in the form changed — the save has to
    // be asked for, as it does when a row leaves.
    section.current?.save()
  }

  function remove(key: string) {
    setEntries((current) => {
      const next = current.filter((entry) => entry.key !== key)
      return next.length > 0
        ? next
        : [{ key: `added-${(added.current += 1)}`, ...BLANK }]
    })
    // Nothing in the form changed — a row left it — so the save has to be asked
    // for, or the removed entry would sit in the database until the next edit.
    section.current?.save()
  }

  return (
    <AutosaveSection
      ref={section}
      title="Food"
      description="Everything you ate today, in the order you ate it."
      date={date}
      action={saveFood}
    >
      {entries.map((entry, index) => (
        <div
          key={entry.key}
          className="flex flex-col gap-4 border-t border-black/10 pt-4 first:border-t-0 first:pt-0 dark:border-white/10"
        >
          {entries.length > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(entry.key)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
              >
                Remove
              </button>
            </div>
          ) : null}

          <Field label="What you ate" htmlFor={`eaten-${entry.key}`} required>
            <Textarea
              id={`eaten-${entry.key}`}
              name="eaten"
              placeholder="Omelette of 2 eggs, avocado, salad leaves, rye bread."
              defaultValue={entry.eaten}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Portion" htmlFor={`amount-${entry.key}`}>
              <Input
                id={`amount-${entry.key}`}
                name="amount"
                placeholder="≈250 g"
                defaultValue={entry.amount}
              />
            </Field>

            <Field label="Prepared how" htmlFor={`method-${entry.key}`}>
              <Input
                id={`method-${entry.key}`}
                name="method"
                placeholder="Steamed, stewed…"
                defaultValue={entry.method}
              />
            </Field>

            <Field label="Time" htmlFor={`time-${entry.key}`} required>
              <Input
                id={`time-${entry.key}`}
                name="eatenAt"
                type="time"
                defaultValue={entry.eatenAt}
              />
            </Field>
          </div>

          {/* One field per entry, newline separated: a flat repeated field
              could not say which of five photos belonged to which entry. */}
          <input
            type="hidden"
            name="photoPaths"
            value={entry.photoPaths.join('\n')}
          />
          <MealPhotos
            entryKey={entry.key}
            paths={entry.photoPaths}
            urls={photoUrls}
            clientId={clientId}
            onChange={(paths) => setPhotos(entry.key, paths)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-black/15 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-white/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add another
      </button>
    </AutosaveSection>
  )
}
