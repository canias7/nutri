import type { Metadata } from 'next'

import { Chat } from '@/components/messages/chat'
import { requireClient } from '@/lib/auth/session'
import { resolveToday } from '@/lib/diary/today'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Messages · nutri' }

export default async function MessagesPage() {
  const { viewer, client } = await requireClient()
  const today = await resolveToday()
  const supabase = await createClient()

  // The thread does not wait on a nutritionist being linked. It belongs to the
  // client either way, and whoever they link to later reads it from the top.
  const [{ data: coach }, { data: rows }] = await Promise.all([
    client.nutritionist_id
      ? supabase
          .from('profiles')
          .select('full_name')
          .eq('id', client.nutritionist_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('direct_messages')
      .select('id, body, created_at, author_id, read_at')
      .eq('client_id', viewer.id)
      .order('created_at'),
  ])

  const coachName = coach?.full_name || 'Your nutritionist'
  const messages = (rows ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    mine: row.author_id === viewer.id,
  }))
  const hasUnread = (rows ?? []).some(
    (row) => row.author_id !== viewer.id && row.read_at === null,
  )

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          General questions and support.
        </p>
      </header>

      <Chat
        messages={messages}
        coachName={coachName}
        hasUnread={hasUnread}
        today={today}
      />
    </div>
  )
}
