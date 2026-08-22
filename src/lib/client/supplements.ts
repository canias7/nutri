'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireClient } from '@/lib/auth/session'
import { failed, field, invalid, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

const supplementSchema = z.object({
  name: z.string().trim().min(1, 'Give it a name').max(120),
  dose: z.string().trim().max(120).optional(),
})

export async function addSupplement(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    name: field(formData, 'name'),
    dose: field(formData, 'dose'),
  }

  const parsed = supplementSchema.safeParse(values)
  if (!parsed.success) return invalid(parsed.error, values)

  const { viewer } = await requireClient()
  const supabase = await createClient()

  const { error } = await supabase.from('supplements').insert({
    client_id: viewer.id,
    name: parsed.data.name,
    dose: parsed.data.dose ?? '',
    take_morning: formData.get('takeMorning') === 'on',
    take_daytime: formData.get('takeDaytime') === 'on',
    take_evening: formData.get('takeEvening') === 'on',
  })

  if (error) return failed('Could not add that supplement. Try again.', values)

  revalidatePath('/supplements')
  revalidatePath('/diary/[date]', 'page')
  return { status: 'idle' }
}

export async function removeSupplement(id: string): Promise<void> {
  await requireClient()
  const supabase = await createClient()

  // Deleting would take the historical intake rows with it, and the record of
  // what someone was taking while a symptom changed is the point of the diary.
  // Retiring keeps the history and drops it off today's checklist.
  await supabase.from('supplements').update({ is_active: false }).eq('id', id)

  revalidatePath('/supplements')
  revalidatePath('/diary/[date]', 'page')
}

export async function restoreSupplement(id: string): Promise<void> {
  await requireClient()
  const supabase = await createClient()
  await supabase.from('supplements').update({ is_active: true }).eq('id', id)

  revalidatePath('/supplements')
  revalidatePath('/diary/[date]', 'page')
}
