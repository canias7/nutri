import { redirect } from 'next/navigation'

import { resolveToday } from '@/lib/diary/today'

/** /diary always means today, resolved in the reader's timezone. */
export default async function DiaryTodayPage() {
  redirect(`/diary/${await resolveToday()}`)
}
