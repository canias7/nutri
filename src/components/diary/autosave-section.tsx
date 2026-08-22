'use client'

import {
  useActionState,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useTransition,
} from 'react'
import type { ReactNode, Ref } from 'react'

import { idleSaveState, type SaveState } from '@/lib/diary/save-state'

/** Lets a section ask for a save when nothing in the form itself changed. */
export type AutosaveHandle = { save: () => void }

const SAVE_DELAY_MS = 900
/** How long to wait before retrying when a save is already in flight. */
const RETRY_DELAY_MS = 250

/**
 * A diary section that saves itself.
 *
 * Each section is its own form and its own action, so a slow save in one does
 * not block typing in another, and a failure is reported where it happened
 * rather than over the whole page.
 *
 * Edits are debounced: typing restarts the timer, so a sentence is one write
 * rather than one per keystroke. Leaving a field flushes sooner, because someone
 * who has moved on expects their answer to be committed.
 *
 * The action is dispatched directly inside a transition rather than by calling
 * `form.requestSubmit()`. Submitting imperatively while a previous save was
 * still in flight — which is exactly what editing several fields quickly does —
 * threw and took the whole page down with it. Dispatching means a save that
 * arrives mid-flight can simply wait its turn.
 */
export function AutosaveSection({
  title,
  description,
  date,
  action,
  children,
  hideSavedBadge,
  optional,
  ref,
}: {
  title: string
  description?: string
  date: string
  action: (state: SaveState, formData: FormData) => Promise<SaveState>
  children: ReactNode
  /** Says outright that the section can be left blank. */
  optional?: boolean
  /**
   * Drops the "Saved" badge once a save lands. Failures and work in progress
   * still show — it is the badge that sits there afterwards that is noise.
   */
  hideSavedBadge?: boolean
  /**
   * Exposes a save, for a section whose shape can change without any field
   * changing — removing a row leaves nothing behind to fire an onChange.
   */
  ref?: Ref<AutosaveHandle>
}) {
  const [state, formAction, pending] = useActionState(action, idleSaveState)
  const [, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dirty, setDirty] = useState(false)

  // Read inside a timeout callback, which closes over whatever was current when
  // it was scheduled rather than the latest render.
  const pendingRef = useRef(pending)
  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  // Held in a ref so the retry timeout can reach the latest version without the
  // callback having to name itself.
  const submitRef = useRef<() => void>(() => {})

  const submit = useCallback(() => {
    const form = formRef.current
    if (!form) return

    // A save is already in flight. Come back to it rather than dispatching a
    // second one over the top.
    if (pendingRef.current) {
      timer.current = setTimeout(() => submitRef.current(), RETRY_DELAY_MS)
      return
    }

    setDirty(false)
    const data = new FormData(form)
    startTransition(() => formAction(data))
  }, [formAction])

  useEffect(() => {
    submitRef.current = submit
  }, [submit])

  const schedule = useCallback(
    (delay: number) => {
      setDirty(true)
      clearTimer()
      timer.current = setTimeout(submit, delay)
    },
    [clearTimer, submit],
  )

  // Zero rather than immediate: the caller has usually just changed state, and
  // the form has to re-render before there is anything new to read off it.
  useImperativeHandle(ref, () => ({ save: () => schedule(0) }), [schedule])

  // A pending timer would otherwise fire after navigation, against a form that
  // is no longer mounted.
  useEffect(() => clearTimer, [clearTimer])

  return (
    <section className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="flex items-center gap-2 font-semibold">
            {title}
            {optional ? <OptionalTag /> : null}
          </h2>
          {description ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        <SaveStatus
          pending={pending}
          dirty={dirty}
          state={state}
          hideSaved={hideSavedBadge}
        />
      </header>

      <form
        ref={formRef}
        onChange={() => schedule(SAVE_DELAY_MS)}
        onBlur={() => {
          if (dirty) schedule(0)
        }}
        onSubmit={(event) => {
          // Enter in a text field would otherwise reload the page.
          event.preventDefault()
          schedule(0)
        }}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="date" value={date} />
        {children}
      </form>
    </section>
  )
}

export function OptionalTag() {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
      Optional
    </span>
  )
}

function SaveStatus({
  pending,
  dirty,
  state,
  hideSaved,
}: {
  pending: boolean
  dirty: boolean
  state: SaveState
  hideSaved?: boolean
}) {
  if (state.status === 'error') {
    return (
      <span role="alert" className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400">
        {state.message ?? 'Not saved'}
      </span>
    )
  }

  if (pending) return <Badge tone="muted">Saving…</Badge>
  if (dirty) return <Badge tone="muted">Unsaved</Badge>
  if (state.status === 'saved' && !hideSaved) return <Badge tone="good">Saved</Badge>
  return null
}

function Badge({
  tone,
  children,
}: {
  tone: 'muted' | 'good'
  children: ReactNode
}) {
  const look =
    tone === 'good'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
      : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'

  return (
    <span
      role="status"
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${look}`}
    >
      {children}
    </span>
  )
}
