'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireClient } from '@/lib/auth/session'
import { failed, field, invalid, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

import { onboardingSchema } from './onboarding'

// The same answers as onboarding, plus the name, which onboarding takes at
// sign-up instead.
const profileSchema = onboardingSchema.extend({
  fullName: z.string().trim().min(1, 'Please enter your name').max(120),
})

const FIELDS = [
  'fullName',
  'age',
  'gender',
  'heightCm',
  'startWeightKg',
  'goal',
  'goalDeadline',
  'complaintEmotional',
  'complaintDigestion',
  'complaintSkin',
  'complaintOther',
  'waterTargetMl',
] as const

export async function updateProfile(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = Object.fromEntries(
    FIELDS.map((name) => [name, field(formData, name)]),
  ) as Record<string, string>

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error, values)

  const { viewer } = await requireClient()
  const supabase = await createClient()
  const input = parsed.data

  const [{ error: profileError }, { error: clientError }] = await Promise.all([
    supabase
      .from('profiles')
      .update({ full_name: input.fullName })
      .eq('id', viewer.id),
    supabase
      .from('clients')
      .update({
        age: input.age ?? null,
        gender: input.gender || null,
        height_cm: input.heightCm ?? null,
        start_weight_kg: input.startWeightKg ?? null,
        goal: input.goal,
        goal_deadline: input.goalDeadline,
        initial_complaints: {
          emotional: input.complaintEmotional ?? '',
          digestion: input.complaintDigestion ?? '',
          skin: input.complaintSkin ?? '',
          other: input.complaintOther ?? '',
        },
        ...(input.waterTargetMl ? { water_target_ml: input.waterTargetMl } : {}),
      })
      .eq('profile_id', viewer.id),
  ])

  if (profileError || clientError) {
    return failed('Could not save your changes. Try again.', values)
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { status: 'idle', message: 'Saved.' }
}
