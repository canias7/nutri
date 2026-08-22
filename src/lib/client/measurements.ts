'use server'

import { revalidatePath } from 'next/cache'

import { requireClient } from '@/lib/auth/session'
import { failed, field, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'
import { isValidDateParam } from '@/lib/diary/date'

/** Blank means "not measured this time", which is different from zero. */
function optionalCm(formData: FormData, name: string): number | null {
  const raw = field(formData, name)
  if (raw === '') return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export async function saveMeasurements(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const measuredOn = field(formData, 'measuredOn')
  if (!isValidDateParam(measuredOn)) {
    return {
      status: 'error',
      fieldErrors: { measuredOn: ['Pick a date'] },
    }
  }

  const { viewer } = await requireClient()
  const supabase = await createClient()

  const row = {
    client_id: viewer.id,
    measured_on: measuredOn,
    weight_kg: optionalCm(formData, 'weightKg'),
    chest_cm: optionalCm(formData, 'chestCm'),
    waist_cm: optionalCm(formData, 'waistCm'),
    hips_cm: optionalCm(formData, 'hipsCm'),
    upper_arm_left_cm: optionalCm(formData, 'upperArmLeftCm'),
    upper_arm_right_cm: optionalCm(formData, 'upperArmRightCm'),
    thigh_left_cm: optionalCm(formData, 'thighLeftCm'),
    thigh_right_cm: optionalCm(formData, 'thighRightCm'),
    above_knee_left_cm: optionalCm(formData, 'aboveKneeLeftCm'),
    above_knee_right_cm: optionalCm(formData, 'aboveKneeRightCm'),
    notes: field(formData, 'notes'),
  }

  // Re-measuring the same day replaces that entry rather than stacking a second.
  const { error } = await supabase
    .from('body_measurements')
    .upsert(row, { onConflict: 'client_id,measured_on' })

  if (error) return failed('Could not save your measurements. Try again.')

  revalidatePath('/measurements')
  revalidatePath('/dashboard')
  return { status: 'idle', message: 'Measurements saved.' }
}

export async function deleteMeasurement(id: string): Promise<void> {
  await requireClient()
  const supabase = await createClient()
  await supabase.from('body_measurements').delete().eq('id', id)
  revalidatePath('/measurements')
}
