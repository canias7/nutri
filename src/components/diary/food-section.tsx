'use client'

import { useRef, useState } from 'react'

import { AutosaveSection, type AutosaveHandle } from '@/components/diary/autosave-section'
import { Field, Input, Textarea } from '@/components/form-fields'
import { deleteMealPhoto, uploadMealPhoto } from '@/lib/client/meal-photos'
import { saveFood } from '@/lib/diary/actions'
import type { LogMeal } from '@/lib/diary/queries'

type Entry = {
  /** Stable across re-orders so an uncontrolled field keeps what was typed. */
  key: string
  eaten: string
  amount: string
  method: string
  eatenAt: string
  /** Object name in the bucket, or empty. Held in state, not in the DOM. */
  photoPath: string
}

/**
 * An optional photo of what was eaten.
 *
 * A picture carries a portion better than "≈250 g" does, and it is the thing a
 * nutritionist reads a food diary for that words are worst at — so it is offered
 * on every entry and required on none.
 */
function PhotoField({
  entryKey,
  path,
  url,
  clientId,
  onChange,
}: {
  entryKey: string
  path: string
  url: string | undefined
  clientId: string
  onChange: (path: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A local preview covers the gap before the signed URL for a fresh upload
  // arrives with the next render.
  const [preview, setPreview] = useState<string | null>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)

    const result = await uploadMealPhoto(file, clientId)
    setBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }
    if (path) void deleteMealPhoto(path)
    setPreview(URL.createObjectURL(file))
    onChange(result.path)
  }

  function clear() {
    if (path) void deleteMealPhoto(path)
    setPreview(null)
    onChange('')
  }

  const shown = preview ?? url

  return (
    <div className="flex flex-col gap-2">
      {shown ? (
        <div className="flex items-start gap-3">
          {/* Plain img: these are signed URLs on a bucket the optimiser has no
              credentials for, and they expire. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt="What you ate"
            className="size-24 shrink-0 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10"
          />
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
          >
            Remove photo
          </button>
        </div>
      ) : (
        <label
          className={`flex w-fit cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-black/15 px-3.5 py-2 text-sm font-medium transition dark:border-white/20 ${
            busy
              ? 'cursor-wait text-slate-400'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9Z" />
            <circle cx="12" cy="12.5" r="3.2" />
          </svg>
          {busy ? 'Uploading…' : 'Add a photo'}
          <span className="text-xs font-normal text-slate-400">Optional</span>
          <input
            id={`photo-${entryKey}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              void pick(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Times come back from Postgres as HH:MM:SS; the input wants HH:MM. */
function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : ''
}

const BLANK = { eaten: '', amount: '', method: '', eatenAt: '', photoPath: '' }

function fromMeals(meals: LogMeal[]): Entry[] {
  if (meals.length === 0) return [{ key: 'blank', ...BLANK }]

  return meals.map((meal) => ({
    key: meal.id,
    eaten: meal.eaten,
    amount: meal.amount,
    method: meal.method,
    eatenAt: toTimeInput(meal.eaten_at),
    photoPath: meal.photo_path,
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
  // Read off what was saved rather than what is typed: the autosave lands within
  // the second, and a marker that flickers on every keystroke is worse than one
  // that catches up.
  const incomplete =
    meals.length === 0 || meals.some((meal) => !meal.eaten.trim() || !meal.eaten_at)

  const [entries, setEntries] = useState<Entry[]>(() => fromMeals(meals))
  const added = useRef(0)
  const section = useRef<AutosaveHandle>(null)

  function add() {
    added.current += 1
    setEntries((current) => [...current, { key: `added-${added.current}`, ...BLANK }])
  }

  function setPhoto(key: string, photoPath: string) {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, photoPath } : entry)),
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
      hideSavedBadge
      incomplete={incomplete}
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

          <input type="hidden" name="photoPath" value={entry.photoPath} />
          <PhotoField
            entryKey={entry.key}
            path={entry.photoPath}
            url={photoUrls[entry.photoPath]}
            clientId={clientId}
            onChange={(photoPath) => setPhoto(entry.key, photoPath)}
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
