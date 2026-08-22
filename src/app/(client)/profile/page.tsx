import type { Metadata } from 'next'

import { Placeholder } from '@/components/placeholder'
import { requireClient } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Profile & goals · nutri' }

export default async function ProfilePage() {
  const { client } = await requireClient()

  return (
    <Placeholder
      title="Profile & goals"
      description="Your parameters and what you are working towards."
    >
      {client.goal ? `Current goal: ${client.goal}` : 'No goal set yet.'}
    </Placeholder>
  )
}
