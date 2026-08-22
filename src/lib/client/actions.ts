'use server'

import { redirect } from 'next/navigation'

import { requireClient } from '@/lib/auth/session'
import { failed, field, invalid, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

import { onboardingSchema } from './onboarding'

const TEXT_FIELDS = [
  'inviteCode',
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

export async function completeOnboarding(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = Object.fromEntries(
    TEXT_FIELDS.map((name) => [name, field(formData, name)]),
  ) as Record<string, string>

  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error, values)

  const { viewer } = await requireClient()
  const supabase = await createClient()
  const input = parsed.data

  // Link to a coach first: if the code is wrong the user should be able to fix
  // it without having lost the rest of their answers.
  if (input.inviteCode) {
    const { error } = await supabase.rpc('link_nutritionist', {
      code: input.inviteCode,
    })

    if (error) {
      return {
        status: 'error',
        fieldErrors: {
          inviteCode: ['That invite code was not found. Check it with your nutritionist.'],
        },
        values,
      }
    }
  }

  const { error } = await supabase
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
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('profile_id', viewer.id)

  if (error) {
    return failed('Could not save your profile. Try again.', values)
  }

  redirect('/dashboard')
}
