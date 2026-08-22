import type { Metadata } from 'next'

import { Placeholder } from '@/components/placeholder'
import { requireCoach } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Messages · nutri' }

export default async function CoachMessagesPage() {
  await requireCoach()

  return (
    <Placeholder
      title="Messages"
      description="General questions and support, separate from any one diary day."
    >
      One thread per client, plus the day-specific discussions you have opened on
      their diaries.
    </Placeholder>
  )
}
