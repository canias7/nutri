import type { ComponentProps, ReactNode } from 'react'

const controlClasses =
  'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 ' +
  'shadow-xs outline-none transition placeholder:text-slate-400 ' +
  'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'dark:border-white/15 dark:bg-white/5 dark:text-slate-50 dark:placeholder:text-slate-500'

export function Field({
  label,
  htmlFor,
  hint,
  errors,
  required,
  children,
}: {
  label: string
  htmlFor: string
  hint?: ReactNode
  errors?: string[]
  /** Marks the answer as one the diary expects. Nothing is ever blocked — a
      half-filled day still saves — but the reader can see what is missing. */
  required?: boolean
  children: ReactNode
}) {
  const errorId = `${htmlFor}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {label}
        {required ? (
          <>
            <span aria-hidden className="ml-0.5 text-red-500">*</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {children}
      {hint && !errors?.length ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {errors?.length ? (
        <p id={errorId} className="text-xs font-medium text-red-600 dark:text-red-400">
          {errors[0]}
        </p>
      ) : null}
    </div>
  )
}

export function Input({
  invalid,
  className,
  ...props
}: ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={[
        controlClasses,
        invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '',
        className ?? '',
      ].join(' ')}
    />
  )
}

export function Textarea({
  invalid,
  className,
  ...props
}: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={[
        controlClasses,
        'min-h-24 resize-y',
        invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : '',
        className ?? '',
      ].join(' ')}
    />
  )
}

/** Form-level failure, as opposed to a message against one field. */
export function FormMessage({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
    >
      {children}
    </p>
  )
}
