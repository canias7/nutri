import { redirect } from 'next/navigation'

import { AppShell } from '@/components/app-shell'
import { hasCompletedOnboarding, requireClient } from '@/lib/auth/session'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/diary', label: "Today's diary" },
  { href: '/history', label: 'History' },
  { href: '/measurements', label: 'Measurements' },
  { href: '/supplements', label: 'Supplements' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
]

export default async function DashboardLayout({ children }: LayoutProps<'/'>) {
  const { viewer, client } = await requireClient()
  if (!hasCompletedOnboarding(client)) redirect('/onboarding')

  return (
    <AppShell name={viewer.profile.full_name || 'Your diary'} nav={NAV}>
      {children}
    </AppShell>
  )
}
