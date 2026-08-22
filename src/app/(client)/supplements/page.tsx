import type { Metadata } from 'next'

import { Placeholder } from '@/components/placeholder'
import { requireClient } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Supplements · nutri' }

export default async function SupplementsPage() {
  await requireClient()

  return (
    <Placeholder
      title="Regular supplements"
      description="These appear as checkboxes in your daily log."
    >
      Your list, with morning, daytime and evening timing.
    </Placeholder>
  )
}
