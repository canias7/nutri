import { AppShell } from '@/components/app-shell'
import { requireCoach } from '@/lib/auth/session'

const NAV = [
  { href: '/coach', label: 'Clients' },
  { href: '/coach/messages', label: 'Messages' },
  { href: '/coach/settings', label: 'Invite code' },
]

export default async function CoachLayout({ children }: LayoutProps<'/coach'>) {
  const { viewer } = await requireCoach()

  return (
    <AppShell name={viewer.profile.full_name || 'Nutritionist'} nav={NAV}>
      {children}
    </AppShell>
  )
}
