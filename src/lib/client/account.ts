'use server'

import { redirect } from 'next/navigation'

import { requireClient } from '@/lib/auth/session'
import { failed, field, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

/**
 * Deletes the account and everything attached to it.
 *
 * The typed-name confirmation is checked here rather than only in the browser:
 * a Server Action is reachable by direct POST, and this is the one call in the
 * app that cannot be undone.
 */
export async function deleteAccount(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const typed = field(formData, 'confirmName')
  const { viewer } = await requireClient()

  const expected = viewer.profile.full_name.trim()
  if (!expected || typed.toLowerCase() !== expected.toLowerCase()) {
    return {
      status: 'error',
      fieldErrors: { confirmName: ['That does not match your name.'] },
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    return failed('Could not delete the account. Try again, or sign out and back in first.')
  }

  await supabase.auth.signOut()
  redirect('/?deleted=1')
}
