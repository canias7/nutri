import type { Metadata } from 'next'

import { SupplementsManager } from '@/components/supplements/supplements-manager'
import { requireClient } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Supplements · nutri' }

export default async function SupplementsPage() {
  const { viewer } = await requireClient()
  const supabase = await createClient()

  const { data } = await supabase
    .from('supplements')
    .select('*')
    .eq('client_id', viewer.id)
    .order('sort_order')
    .order('created_at')

  const all = data ?? []

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Regular supplements</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          These become checkboxes in your daily log, so ticking them off takes a
          second rather than typing them out each day.
        </p>
      </header>

      <SupplementsManager
        active={all.filter((s) => s.is_active)}
        retired={all.filter((s) => !s.is_active)}
      />
    </div>
  )
}
