'use client'

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react'

import { markThreadRead, sendMessage } from '@/lib/client/messages'
import { addDays, formatShortDate } from '@/lib/diary/date'
import { idleFormState } from '@/lib/forms'

export type ChatMessage = {
  id: string
  body: string
  created_at: string
  mine: boolean
}

type Shown = ChatMessage & { sending?: boolean }

/**
 * The conversation with the nutritionist.
 *
 * Built as a chat rather than a list with a form under it, because that is what
 * it is: the newest message sits at the bottom, the composer never scrolls away,
 * and a run of messages from one person is drawn as one run rather than as three
 * separate cards.
 *
 * A sent message appears immediately and greys until the server has it. Waiting
 * a round trip to see your own words is the thing that makes a chat feel broken.
 */
export function Chat({
  messages,
  coachName,
  hasUnread,
  today,
}: {
  messages: ChatMessage[]
  coachName: string
  hasUnread: boolean
  /** The reader's own date, resolved on the server from their timezone. */
  today: string
}) {
  const [optimistic, addOptimistic] = useOptimistic<Shown[], string>(
    messages,
    (current, body) => [
      ...current,
      {
        id: `sending-${current.length}`,
        body,
        created_at: new Date().toISOString(),
        mine: true,
        sending: true,
      },
    ],
  )
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Pinned to the newest message, the way every chat behaves.
  useEffect(() => {
    const box = boxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [optimistic.length])

  // Having the thread open is what counts as reading it.
  useEffect(() => {
    if (hasUnread) void markThreadRead()
  }, [hasUnread])

  function send(formData: FormData) {
    const body = String(formData.get('body') ?? '').trim()
    if (!body) return

    setError(null)
    addOptimistic(body)
    formRef.current?.reset()
    grow(inputRef.current)

    startTransition(async () => {
      const result = await sendMessage(idleFormState, formData)
      if (result.status === 'error') {
        setError(result.message ?? 'Could not send that. Try again.')
      }
    })
  }

  const groups = groupByDay(optimistic, today)

  return (
    <div className="flex h-[70dvh] max-h-[760px] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
      <header className="flex items-center gap-3 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
        >
          {initial(coachName)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{coachName}</span>
          <span className="truncate text-xs text-slate-500 dark:text-slate-400">
            General questions, not tied to a diary day
          </span>
        </span>
      </header>

      <div
        ref={boxRef}
        // A column that pushes its content down: a short conversation sits on
        // the composer rather than floating at the top of an empty box.
        className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-4"
        role="log"
        aria-label={`Conversation with ${coachName}`}
      >
        {optimistic.length === 0 ? (
          <Empty />
        ) : (
          <ol className="mt-auto flex flex-col gap-4">
            {groups.map((group) => (
              <li key={group.day} className="flex flex-col gap-1.5">
                <p className="my-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {group.label}
                </p>
                {group.messages.map((message, index) => {
                  /* Only the last of a run is stamped, so a burst of three reads
                     as one thought rather than three filed records. A quarter of
                     an hour of silence ends the run even from the same person —
                     otherwise this morning and this minute share a timestamp. */
                  const next = group.messages[index + 1]
                  const endsRun =
                    !next ||
                    next.mine !== message.mine ||
                    minutesBetween(message.created_at, next.created_at) > 15

                  return (
                    <Bubble
                      key={message.id}
                      message={message}
                      endsRun={endsRun}
                      startsRun={index === 0 || group.messages[index - 1].mine !== message.mine}
                    />
                  )
                })}
              </li>
            ))}
          </ol>
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      <form
        ref={formRef}
        action={send}
        className="flex items-end gap-2 border-t border-black/5 p-3 dark:border-white/10"
      >
        <textarea
          ref={inputRef}
          name="body"
          rows={1}
          placeholder="Write a message…"
          aria-label="Your message"
          onInput={(event) => grow(event.currentTarget)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter is a new line. On a phone the key is a
            // newline either way, so the button is the only way to send there.
            if (event.key === 'Enter' && !event.shiftKey && !isTouch()) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-[15px] leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-50 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          aria-label="Send"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4.5 12h13m0 0-5-5m5 5-5 5" />
          </svg>
        </button>
      </form>
    </div>
  )
}

function Bubble({
  message,
  endsRun,
  startsRun,
}: {
  message: Shown
  endsRun: boolean
  startsRun: boolean
}) {
  const mine = message.mine

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-6 whitespace-pre-line ${
          mine
            ? `bg-emerald-600 text-white ${endsRun ? 'rounded-br-md' : ''} ${
                startsRun ? '' : 'rounded-tr-md'
              }`
            : `border border-black/10 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 ${
                endsRun ? 'rounded-bl-md' : ''
              } ${startsRun ? '' : 'rounded-tl-md'}`
        } ${message.sending ? 'opacity-60' : ''}`}
      >
        {message.body}
        {endsRun ? (
          <span
            // Local time, which the server cannot know; the first client render
            // corrects it.
            suppressHydrationWarning
            className={`mt-0.5 block text-[11px] tabular-nums ${
              mine ? 'text-emerald-50/75' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {message.sending ? 'Sending…' : clockTime(message.created_at)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M20 14.5a2 2 0 0 1-2 2H8l-4 3.5v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8.5Z" />
        </svg>
      </span>
      <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
        Nothing here yet. Ask anything — this thread is for general questions,
        separate from notes on a particular day.
      </p>
    </div>
  )
}

/** "Today", "Yesterday", or the date — one separator per day of conversation. */
function groupByDay(messages: Shown[], today: string) {
  const groups: { day: string; label: string; messages: Shown[] }[] = []

  for (const message of messages) {
    // Grouped on the UTC day rather than the reader's, so the server and the
    // browser agree on where the separators go and nothing re-renders under them.
    const day = message.created_at.slice(0, 10)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.messages.push(message)
    else groups.push({ day, label: dayLabel(day, today), messages: [message] })
  }

  return groups
}

function dayLabel(day: string, today: string): string {
  if (day === today) return 'Today'
  if (day === addDays(today, -1)) return 'Yesterday'
  return formatShortDate(day)
}

function minutesBetween(a: string, b: string): number {
  return Math.abs(Date.parse(b) - Date.parse(a)) / 60_000
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function isTouch(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
}

/** Grows with what is typed, up to the max-height the class sets. */
function grow(field: HTMLTextAreaElement | null) {
  if (!field) return
  field.style.height = 'auto'
  field.style.height = `${field.scrollHeight}px`
}
