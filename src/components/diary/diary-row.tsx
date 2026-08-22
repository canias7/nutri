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
  icon,
  title,
  summary,
  need,
  status,
  defaultOpen = false,
  children,
}: {
  /** The emoji that marks the row. Decorative — the title carries the meaning. */
  icon: string
  title: string
  /** What is already in the section, shown while it is closed. */
  summary?: ReactNode
  need: SectionNeed
  /** The section's own save state, which outranks the pill when it has news. */
  status?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const required = !need.optional
  const done = need.missing.length === 0

  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-black/10 open:bg-slate-50/60 dark:border-white/10 dark:open:bg-white/[0.03]"
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 outline-none [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg dark:bg-white/10"
        >
          {icon}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            {title}
            {required ? (
              <span aria-hidden className="ml-1 align-super text-[10px] text-red-500">
                ✳
              </span>
            ) : null}
          </span>
          {summary ? (
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">{summary}</span>
          ) : null}
        </span>

        {/* The save state when there is one to report, otherwise how much of the
            section is left. Two badges side by side would be one too many. */}
        {status ?? <Pill need={need} done={done} />}

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

/** Done, what is left, or nothing to do. */
function Pill({ need, done }: { need: SectionNeed; done: boolean }) {
  if (need.optional && done) {
    return (
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
        Optional
      </span>
    )
  }

  if (done) {
    return (
      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        Done
      </span>
    )
  }

  return (
    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-500">
      {need.missing.length === 1 ? '1 to fill' : `${need.missing.length} to fill`}
    </span>
  )
}
