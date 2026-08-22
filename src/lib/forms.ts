import { z } from 'zod'

/**
 * What every form action in the app hands back to `useActionState`.
 *
 * `values` is echoed so a rejected form re-renders with what the user typed
 * instead of clearing itself. Passwords are never echoed.
 */
export type FormState = {
  status: 'idle' | 'error'
  /** Message that applies to the whole form, e.g. a rejected login. */
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
  values?: Record<string, string>
}

export const idleFormState: FormState = { status: 'idle' }

export function invalid(
  error: z.ZodError,
  values?: Record<string, string>,
): FormState {
  return {
    status: 'error',
    fieldErrors: z.flattenError(error).fieldErrors,
    values,
  }
}

export function failed(
  message: string,
  values?: Record<string, string>,
): FormState {
  return { status: 'error', message, values }
}

/** Reads a form field as a trimmed string. */
export function field(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}
