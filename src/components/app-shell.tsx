import Link from 'next/link'
import type { ReactNode } from 'react'

import { InstallPrompt } from '@/components/install-prompt'
import { Logo } from '@/components/logo'
import { NavTabs, type NavItem } from '@/components/nav-tabs'
import { signOut } from '@/lib/auth/actions'

export function AppShell({
  name,
  nav,
  children,
}: {
  name: string
  nav: NavItem[]
  children: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-black/60">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <Link href={nav[0]?.href ?? '/'}>
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline dark:text-slate-400">
              {name}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <NavTabs items={nav} />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6 pb-24">
        <InstallPrompt />
        {children}
      </main>
    </div>
  )
}
