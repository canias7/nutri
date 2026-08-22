'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireCoach } from '@/lib/auth/session'
import { failed, field, invalid, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

// Mirrors the CHECK constraint on nutritionists.invite_code.
const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Use at least 3 characters')
    .max(40, 'Keep it under 40 characters')
    .regex(
      /^[a-z0-9_-]+$/,
      'Letters, numbers, hyphens and underscores only — no spaces',
    ),
})

export async function setInviteCode(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { inviteCode: field(formData, 'inviteCode') }

  const parsed = inviteCodeSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error, values)

  // Server Actions are reachable by direct POST, so the role is checked here
  // rather than trusting that the page enforced it.
  const { viewer } = await requireCoach()

  const supabase = await createClient()
  const { error } = await supabase
    .from('nutritionists')
    .update({ invite_code: parsed.data.inviteCode })
    .eq('profile_id', viewer.id)

  if (error) {
    // 23505 is a unique violation: somebody already claimed this code.
    const message =
      error.code === '23505'
        ? 'That code is already taken by another specialist. Try another.'
        : 'Could not save your invite code. Try again.'
    return failed(message, values)
  }

  revalidatePath('/coach', 'layout')
  return { status: 'idle', message: 'Invite code saved.' }
}
