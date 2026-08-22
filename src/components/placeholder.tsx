import type { ReactNode } from 'react'

/** Marks a screen that is routed and shelled but not built yet. */
export function Placeholder({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </header>

      <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
        {children ?? 'Not built yet.'}
      </div>
    </div>
  )
}
