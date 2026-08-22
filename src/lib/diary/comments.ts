'use server'

import { revalidatePath } from 'next/cache'

import { requireClient } from '@/lib/auth/session'
import { failed, field, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

import { isValidDateParam } from './date'

export async function postDayComment(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const date = field(formData, 'date')
  const body = field(formData, 'body')

  if (!isValidDateParam(date)) return failed('Something went wrong. Reload and try again.')
  if (!body) return { status: 'error', fieldErrors: { body: ['Write something first'] } }

  const { viewer } = await requireClient()
  const supabase = await createClient()

  // A thread hangs off the day's log, so there has to be one. Any section saved
  // creates it; a day with nothing logged has nothing to discuss.
  const { data: log } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('client_id', viewer.id)
    .eq('log_date', date)
    .maybeSingle()

  if (!log) {
    return failed('Log something for this day first, then you can discuss it.')
  }

  const { error } = await supabase.from('day_comments').insert({
    daily_log_id: log.id,
    author_id: viewer.id,
    body,
  })

  if (error) return failed('Could not post that. Try again.')

  revalidatePath(`/diary/${date}`)
  revalidatePath('/dashboard')
  return { status: 'idle' }
}

/** Marks the coach's comments on one day as seen. */
export async function markDayCommentsRead(dailyLogId: string): Promise<void> {
  const { viewer } = await requireClient()
  const supabase = await createClient()

  await supabase
    .from('day_comments')
    .update({ read_at: new Date().toISOString() })
    .eq('daily_log_id', dailyLogId)
    .neq('author_id', viewer.id)
    .is('read_at', null)

  revalidatePath('/dashboard')
  revalidatePath('/history')
}
