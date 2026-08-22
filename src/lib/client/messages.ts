'use server'

import { revalidatePath } from 'next/cache'

import { requireClient } from '@/lib/auth/session'
import { failed, field, type FormState } from '@/lib/forms'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const body = field(formData, 'body')
  if (!body) {
    return { status: 'error', fieldErrors: { body: ['Write something first'] } }
  }

  const { viewer, client } = await requireClient()
  if (!client.nutritionist_id) {
    return failed('You are not linked to a nutritionist yet.')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('direct_messages').insert({
    client_id: viewer.id,
    author_id: viewer.id,
    body,
  })

  if (error) return failed('Could not send that message. Try again.')

  revalidatePath('/messages')
  return { status: 'idle' }
}

/** Marks the coach's messages as read once the client has the thread open. */
export async function markThreadRead(): Promise<void> {
  const { viewer } = await requireClient()
  const supabase = await createClient()

  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('client_id', viewer.id)
    .neq('author_id', viewer.id)
    .is('read_at', null)

  revalidatePath('/messages')
}
