'use client'

import type { ReactNode } from 'react'

import { DiaryRow } from '@/components/diary/diary-row'
import type { SectionNeed } from '@/lib/diary/completeness'

import { useActionState, useEffect, useState } from 'react'

import { FormMessage, Textarea } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { markDayCommentsRead, postDayComment } from '@/lib/diary/comments'
import { idleFormState } from '@/lib/forms'
import type { DayComment } from '@/lib/diary/queries'

export function DayDiscussion({
  date,
  dailyLogId,
  comments,
  coachName,
  hasUnread,
  need,
  summary,
}: {
  date: string
  dailyLogId: string | null
  comments: DayComment[]
  coachName: string | null
  hasUnread: boolean
  need: SectionNeed
  summary?: ReactNode
}) {
  const [state, action] = useActionState(postDayComment, idleFormState)
  // The box is controlled, so emptying it is part of sending rather than
  // something an effect has to do afterwards once the state comes back.
  const [draft, setDraft] = useState('')

  function post(formData: FormData) {
    if (!draft.trim()) return
    setDraft('')
    action(formData)
  }

  // Opening the day is what counts as reading it.
  useEffect(() => {
    if (hasUnread && dailyLogId) void markDayCommentsRead(dailyLogId)
  }, [hasUnread, dailyLogId])

  return (
    <DiaryRow icon="💬" title="Discussion" need={need} summary={summary}>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Questions and answers about this day, kept with the day itself.
      </p>

      {comments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {dailyLogId
            ? 'Nothing yet. Ask about anything you logged today.'
            : 'Log something for this day and you can start a discussion about it.'}
        </p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className={`flex ${comment.mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
                  comment.mine
                    ? 'rounded-br-sm bg-emerald-600 text-white'
                    : 'rounded-bl-sm border border-black/10 bg-white text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100'
                }`}
              >
                {!comment.mine && coachName ? (
                  <span className="mb-0.5 block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {coachName}
                  </span>
                ) : null}
                {comment.body}
                <span
                  // Local time, which the server cannot know; the first client
                  // render corrects it.
                  suppressHydrationWarning
                  className={`mt-1 block text-[11px] ${
                    comment.mine ? 'text-emerald-50/80' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {new Date(comment.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={post} className="flex flex-col gap-3">
        <input type="hidden" name="date" value={date} />
        <FormMessage>{state.message}</FormMessage>

        {/* The section is optional, so pressing Post on an empty box should be
            impossible rather than an error. Nothing to say, nothing to press. */}
        <Textarea
          id="dayComment"
          name="body"
          placeholder="Ask a question or leave a note about this day…"
          aria-label="Your comment on this day"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />

        {/* "Send", not "Post": Post hands over the whole day, and two buttons
            saying the same word a screen apart is how the confusion started. */}
        <SubmitButton pendingLabel="Sending…" disabled={!draft.trim()}>
          Send
        </SubmitButton>
      </form>
    </DiaryRow>
  )
}
