'use client'

import { useActionState, useEffect, useRef } from 'react'

import { FormMessage, Textarea } from '@/components/form-fields'
import { SubmitButton } from '@/components/submit-button'
import { markThreadRead, sendMessage } from '@/lib/client/messages'
import { idleFormState } from '@/lib/forms'

export type Message = {
  id: string
  body: string
  created_at: string
  mine: boolean
}

export function MessageThread({
  messages,
  coachName,
  hasUnread,
}: {
  messages: Message[]
  coachName: string
  hasUnread: boolean
}) {
  const [state, action] = useActionState(sendMessage, idleFormState)
  const formRef = useRef<HTMLFormElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Clear the box once a message lands, and keep the newest one in view.
  useEffect(() => {
    if (state.status === 'idle' && !state.fieldErrors) {
      formRef.current?.reset()
    }
  }, [state])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  // Opening the thread is what counts as reading it.
  useEffect(() => {
    if (hasUnread) void markThreadRead()
  }, [hasUnread])

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          Nothing here yet. Ask {coachName} anything — this thread is for general
          questions, separate from notes on a particular day.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
                  message.mine
                    ? 'rounded-br-sm bg-emerald-600 text-white'
                    : 'rounded-bl-sm border border-black/10 bg-white text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100'
                }`}
              >
                {message.body}
                <span
                  // Local time, which the server cannot know; the first client
                  // render corrects it.
                  suppressHydrationWarning
                  className={`mt-1 block text-[11px] ${
                    message.mine ? 'text-emerald-50/80' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </li>
          ))}
          <div ref={endRef} />
        </ul>
      )}

      <form ref={formRef} action={action} className="flex flex-col gap-3">
        <FormMessage>{state.message}</FormMessage>

        <Textarea
          id="body"
          name="body"
          placeholder="Type a message…"
          aria-label="Your message"
          invalid={Boolean(state.fieldErrors?.body)}
          required
        />
        {state.fieldErrors?.body ? (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {state.fieldErrors.body[0]}
          </p>
        ) : null}

        <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
      </form>
    </div>
  )
}
