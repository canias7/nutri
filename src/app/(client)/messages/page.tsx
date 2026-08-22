import type { Metadata } from 'next'
import Link from 'next/link'

import { MessageThread } from '@/components/messages/message-thread'
import { requireClient } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Messages · nutri' }

export default async function MessagesPage() {
  const { viewer, client } = await requireClient()

  if (!client.nutritionist_id) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            General questions and support.
          </p>
        </header>

        <div className="rounded-2xl border border-dashed border-black/15 p-5 dark:border-white/15">
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            You are not linked to a nutritionist yet, so there is nobody to write
            to. Add their invite code and this opens up.
          </p>
          <Link
            href="/profile"
            className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Add an invite code
          </Link>
        </div>
      </div>
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

  const coachName = coach?.full_name || 'your nutritionist'
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
    <div className="flex max-w-xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          A direct line to {coachName}, not tied to any one diary day.
        </p>
      </header>

      <MessageThread messages={messages} coachName={coachName} hasUnread={hasUnread} />
    </div>
  )
}
