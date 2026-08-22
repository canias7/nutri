'use client'

import { useEffect, useState } from 'react'

import { deleteMealPhoto, uploadMealPhoto } from '@/lib/client/meal-photos'
import { MAX_MEAL_PHOTOS } from '@/lib/diary/meal-photos'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

/**
 * The photos on one food entry.
 *
 * A plate, the label on the packet, what was left afterwards — up to five, and
 * an entry per thing eaten, so a day is not capped at five either. Tapping one
 * opens it full size, because a 96px square is enough to know a photo is there
 * and not enough to read a label off it.
 */
export function MealPhotos({
  entryKey,
  paths,
  urls,
  clientId,
  onChange,
}: {
  entryKey: string
  paths: string[]
  /** Short-lived signed links for what is already stored, by object name. */
  urls: Record<string, string>
  clientId: string
  onChange: (paths: string[]) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState<string | null>(null)
  // Covers the gap before a fresh upload's signed link arrives with the next
  // render, and is revoked when the entry goes.
  const [previews, setPreviews] = useState<Record<string, string>>({})

  useEffect(() => {
    const held = previews
    return () => {
      for (const url of Object.values(held)) URL.revokeObjectURL(url)
    }
    // Revoking on unmount only; the map is appended to, never rewritten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const room = MAX_MEAL_PHOTOS - paths.length

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    const chosen = [...files].slice(0, room)
    if (files.length > room) {
      setError(
        room === 0
          ? `That entry already has ${MAX_MEAL_PHOTOS} photos. Remove one, or start another entry.`
          : `Only ${room} more ${room === 1 ? 'photo' : 'photos'} fit on this entry.`,
      )
    }
    if (chosen.length === 0) return

    setBusy(true)
    const added: string[] = []
    const fresh: Record<string, string> = {}

    for (const file of chosen) {
      const result = await uploadMealPhoto(file, clientId)
      if (!result.ok) {
        setError(result.message)
        break
      }
      added.push(result.path)
      fresh[result.path] = URL.createObjectURL(file)
    }

    setBusy(false)
    if (added.length === 0) return

    setPreviews((current) => ({ ...current, ...fresh }))
    onChange([...paths, ...added])
  }

  function remove(path: string) {
    void deleteMealPhoto(path)
    setPreviews((current) => {
      const url = current[path]
      if (url) URL.revokeObjectURL(url)
      const next = { ...current }
      delete next[path]
      return next
    })
    if (zoomed === path) setZoomed(null)
    onChange(paths.filter((kept) => kept !== path))
  }

  const src = (path: string) => previews[path] ?? urls[path]

  return (
    <div className="flex flex-col gap-2">
      {paths.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {paths.map((path, index) => (
            <li key={path} className="relative">
              <button
                type="button"
                onClick={() => setZoomed(path)}
                aria-label={`View photo ${index + 1} full size`}
                className="block overflow-hidden rounded-xl ring-1 ring-black/10 transition hover:ring-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:ring-white/10"
              >
                {/* Plain img: these are signed URLs on a bucket the optimiser has
                    no credentials for, and they expire. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src(path)}
                  alt={`What you ate, photo ${index + 1}`}
                  className="size-24 object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => remove(path)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-black/10 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/15 dark:hover:bg-red-950/60"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {room > 0 ? (
        <label
          className={`flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-black/15 px-3.5 py-2 text-sm font-medium transition dark:border-white/20 ${
            busy
              ? 'cursor-wait text-slate-400'
              : 'cursor-pointer text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
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
          {busy ? 'Uploading…' : paths.length === 0 ? 'Add a photo' : 'Add another photo'}
          {paths.length > 0 ? (
            <span className="text-xs font-normal text-slate-400">{room} left</span>
          ) : null}
          <input
            id={`photo-${entryKey}`}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              void add(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {zoomed ? (
        <Lightbox src={src(zoomed)} onClose={() => setZoomed(null)} />
      ) : null}
    </div>
  )
}

/** The photo, as big as the screen allows. Escape or a tap anywhere closes it. */
function Lightbox({ src, onClose }: { src: string | undefined; onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // The page behind must not scroll while this is over it.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="What you ate"
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
