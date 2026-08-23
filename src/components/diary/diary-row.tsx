'use client'

import type { ReactNode } from 'react'

import type { SectionNeed } from '@/lib/diary/completeness'

/**
 * One row of the diary: tap the title, the fields open underneath.
 *
 * Built on `<details>` rather than state and a conditional. Three reasons, and
 * the first is not cosmetic:
 *
 *   1. A closed `<details>` keeps its contents in the DOM. Every section here
 *      saves itself as it is typed and registers with Post so the button can
 *      flush it — unmount a closed row and a day's worth of half-typed answers
 *      stops saving, and Post commits a day it can no longer see.
 *   2. Keyboard and screen-reader behaviour is the browser's, not mine.
 *   3. It survives with JavaScript still loading, which for a page people open
 *      one-handed on a phone in a kitchen is worth having.
 *
 * Rows are independent — opening Food does not close Morning. Exclusive
 * accordions are a nuisance the moment you want to check what you already put
 * somewhere else.
 */
export function DiaryRow({
  title,
  summary,
  need,
  status,
  defaultOpen = false,
  children,
}: {
  title: string
  /** What is already in the section, shown while it is closed. */
  summary?: ReactNode
  /** Read only for whether the section is one the diary asks for — that is
      what puts the star beside the title. Nothing here counts what is left. */
  need: SectionNeed
  /** The section's own save state, shown only while it has something to say. */
  status?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const required = !need.optional

  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-black/10 open:bg-slate-50/60 dark:border-white/10 dark:open:bg-white/[0.03]"
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 outline-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            {title}
            {/* The same asterisk the fields inside use, not a pictograph: ✳ is
                in the emoji set and paints as a colour glyph on some platforms. */}
            {required ? (
              <>
                <span aria-hidden className="ml-0.5 text-red-500">*</span>
                <span className="sr-only"> (required)</span>
              </>
            ) : null}
          </span>
          {summary ? (
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">{summary}</span>
          ) : null}
        </span>

        {/* Only the section's own save state, and only while it has news.
            Nothing here scores the row: a diary that grades you out of nine
            invites filling boxes rather than answering them. What is still
            missing is Post's job to say, once, in a sentence. */}
        {status}

        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </summary>

      <div className="px-4 pb-4">{children}</div>
    </details>
  )
}
