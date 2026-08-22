import { redirect } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { UnitProvider } from '@/components/units/unit-provider'
import { hasCompletedOnboarding, requireClient } from '@/lib/auth/session'
import { getUnreadMessageCount } from '@/lib/diary/queries'

export default async function ClientLayout({ children }: LayoutProps<'/'>) {
  const { viewer, client } = await requireClient()
  if (!hasCompletedOnboarding(client)) redirect('/onboarding')

  const unreadMessages = await getUnreadMessageCount(viewer.id)

  const nav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/diary', label: "Today's diary" },
    { href: '/history', label: 'History' },
    { href: '/measurements', label: 'Measurements' },
    { href: '/supplements', label: 'Supplements' },
    { href: '/messages', label: 'Messages', badge: unreadMessages },
    { href: '/profile', label: 'Profile' },
  ]

  return (
    <UnitProvider>
      <AppShell name={viewer.profile.full_name || 'Your diary'} nav={nav}>
        {children}
      </AppShell>
    </UnitProvider>
  )
}
