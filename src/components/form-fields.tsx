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

/**
 * A question with two answers and a third state: unanswered.
 *
 * Not a checkbox. A checkbox has two states, and the day a client has not got
 * to yet would read as a confident "no" to the nutritionist — a different claim
 * from silence. Two radios start with neither chosen, so an untouched day says
 * nothing.
 *
 * Labelled through a div rather than a fieldset: `legend` inside a flex or grid
 * fieldset is laid out by rules of its own, and browsers disagree about them.
 */
export function YesNoField({
  legend,
  name,
  value,
  hint,
}: {
  legend: string
  name: string
  /** Null when nobody has answered — neither button is pressed. */
  value: boolean | null
  hint?: ReactNode
}) {
  const labelId = `${name}-label`

  return (
    <div className="flex flex-col gap-1.5">
      <span
        id={labelId}
        className="text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {legend}
      </span>

      <div role="radiogroup" aria-labelledby={labelId} className="flex gap-2">
        <YesNoChoice name={name} value="yes" label="Yes" checked={value === true} />
        <YesNoChoice name={name} value="no" label="No" checked={value === false} />
      </div>

      {hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

function YesNoChoice({
  name,
  value,
  label,
  checked,
}: {
  name: string
  value: string
  label: string
  checked: boolean
}) {
  // The radio is the control and carries the keyboard behaviour; the label is
  // what you see. Hiding the input visually rather than replacing it keeps arrow
  // keys, screen readers and the form serialisation exactly as the browser
  // intends — so the ring has to be borrowed from it too.
  return (
    <label
      className="flex cursor-pointer select-none items-center justify-center rounded-xl border border-black/10 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500/30 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5 dark:has-[:checked]:border-emerald-500 dark:has-[:checked]:bg-emerald-950/40 dark:has-[:checked]:text-emerald-300"
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="sr-only"
      />
      {label}
    </label>
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
