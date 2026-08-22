'use client'

import { useActionState, useState, useTransition } from 'react'

import { useDiarySections } from '@/components/diary/diary-sections'
import { postDay } from '@/lib/diary/actions'
import { idleSaveState } from '@/lib/diary/save-state'

/**
 * Hands the day over to the nutritionist.
 *
 * Everything above saves itself as it is typed, so this is not what keeps the
 * day — it is what says the day is finished. Which means it can also be the one
 * place the required answers are enforced: nothing is ever blocked while
 * typing, and pressing this on a day with gaps names them rather than refusing
 * silently.
 *
 * Pressing it again after changing an answer is normal, and moves the stamp
 * forward.
 */
export function PostDay({ date, postedAt }: { date: string; postedAt: string | null }) {
  const [state, action] = useActionState(postDay, idleSaveState)
  const [pending, startTransition] = useTransition()
  const [settling, setSettling] = useState(false)
  const sections = useDiarySections()

  const busy = pending || settling

  function submit(formData: FormData) {
    setSettling(true)
    startTransition(async () => {
      // Sections save on a debounce; give the ones with unsaved edits a chance
      // to land before reading the day back.
      await sections?.settle()
      setSettling(false)
      action(formData)
    })
  }

  const posted = state.status === 'saved' || (postedAt !== null && state.status !== 'error')

  return (
    <form action={submit} className="flex flex-col gap-3">
      <input type="hidden" name="date" value={date} />

      {state.status === 'error' ? (
        <p
          role="alert"
          className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Posting…' : posted ? 'Post again' : 'Post this day'}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        {posted
          ? 'Posted. Change anything above and post again to update it.'
          : 'Everything saves as you type. Post when the day is done.'}
      </p>
    </form>
  )
}
