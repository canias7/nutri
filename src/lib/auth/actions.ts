'use server'

import { redirect } from 'next/navigation'

import { failed, field, invalid, type FormState } from '@/lib/forms'
import { getSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'

import { homePathFor } from './session'
import { signInSchema, signUpSchema } from './schemas'

export async function signUp(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    fullName: field(formData, 'fullName'),
    email: field(formData, 'email'),
  }

  const parsed = signUpSchema.safeParse({
    ...values,
    password: String(formData.get('password') ?? ''),
  })
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const siteUrl = await getSiteUrl()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the signup trigger to build the profile and its role row. The
      // role is fixed here rather than taken from the form: a Server Action is
      // reachable by direct POST, so anything the form sends is only a
      // suggestion.
      data: {
        full_name: parsed.data.fullName,
        role: 'client',
        language: 'en',
      },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    return failed(describeSignUpError(error.message), values)
  }

  // With email confirmation switched off, Supabase signs the user straight in.
  if (data.session) {
    redirect(homePathFor('client'))
  }

  redirect(`/check-email?email=${encodeURIComponent(parsed.data.email)}`)
}

export async function signIn(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: field(formData, 'email') }

  const parsed = signInSchema.safeParse({
    ...values,
    password: String(formData.get('password') ?? ''),
  })
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Never distinguish "no such account" from "wrong password": that turns the
    // login form into a way of finding out who has an account here.
    const message =
      error.message === 'Email not confirmed'
        ? 'Confirm your email address first — check your inbox for the link.'
        : 'Invalid email or password.'
    return failed(message, values)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .single()

  redirect(homePathFor(profile?.role ?? 'client'))
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

function describeSignUpError(message: string): string {
  if (/already registered|already been registered/i.test(message)) {
    return 'This email is already in use by another account.'
  }
  if (/password/i.test(message)) {
    return 'Password is too weak. Use at least 6 characters.'
  }
  if (/invalid/i.test(message) && /email/i.test(message)) {
    return 'That email address was rejected. Try another one.'
  }
  if (/rate limit|too many/i.test(message)) {
    return 'Too many attempts just now. Wait a minute and try again.'
  }
  return message
}
