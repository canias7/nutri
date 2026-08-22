import type { Metadata } from 'next'

import { Chat } from '@/components/messages/chat'
import { requireClient } from '@/lib/auth/session'
import { resolveToday } from '@/lib/diary/today'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Messages · nutri' }

export default async function MessagesPage() {
  const { viewer, client } = await requireClient()
  const today = await resolveToday()

  // An unlinked client still gets the conversation, with the composer closed and
  // the reason in it — a bare card explaining the absence teaches nobody where
  // messages will appear once there is somebody to send them to.
  if (!client.nutritionist_id) {
    return (
      <Page>
        <Chat
          messages={[]}
          coachName="Your nutritionist"
          hasUnread={false}
          today={today}
          linked={false}
        />
      </Page>
    )
  }

  const supabase = await createClient()

  const [{ data: coach }, { data: rows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', client.nutritionist_id)
      .maybeSingle(),
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
    <Page>
      <Chat
        messages={messages}
        coachName={coachName}
        hasUnread={hasUnread}
        today={today}
        linked
      />
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          General questions and support.
        </p>
      </header>
      {children}
    </div>
  )
}
