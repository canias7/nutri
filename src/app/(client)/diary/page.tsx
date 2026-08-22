import type { Metadata } from 'next'

import { Placeholder } from '@/components/placeholder'
import { requireClient } from '@/lib/auth/session'

export const metadata: Metadata = { title: "Today's diary · nutri" }

export default async function DiaryPage() {
  await requireClient()

  return (
    <Placeholder
      title="Today's diary"
      description="Fill it in through the day. Everything saves as you type."
    >
      The six steps go here: morning, meals and water, activity and stress,
      supplements, evening, and how you felt.
    </Placeholder>
  )
}
