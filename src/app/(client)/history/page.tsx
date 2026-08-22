import type { Metadata } from 'next'

import { Placeholder } from '@/components/placeholder'
import { requireClient } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'History · nutri' }

export default async function HistoryPage() {
  await requireClient()

  return (
    <Placeholder
      title="Log history"
      description="The last two weeks of diaries, and any day you missed."
    >
      A day-by-day list with completion, weight and water, plus the discussion
      threads your nutritionist has opened.
    </Placeholder>
  )
}
