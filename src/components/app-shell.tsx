import Link from 'next/link'
import type { ReactNode } from 'react'

import { InstallPrompt } from '@/components/install-prompt'
import { Logo } from '@/components/logo'
import { NavSidebarLinks, NavTabLinks, type NavItem } from '@/components/nav-links'
import { signOut } from '@/lib/auth/actions'

/**
 * Sidebar on desktop, top tabs on phones.
 *
 * Seven destinations is more than a top bar carries comfortably once the
 * viewport is wide — they end up cramped in the middle of a lot of empty space.
 * A phone has nowhere to put a sidebar, so it keeps the scrolling tabs.
 */
export function AppShell({
  name,
  nav,
  children,
}: {
  name: string
  nav: NavItem[]
  children: ReactNode
}) {
  const home = nav[0]?.href ?? '/'

  return (
    <div className="flex flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-black/5 bg-white/60 py-5 md:flex dark:border-white/10 dark:bg-white/[0.02]">
        <Link href={home} className="mb-6 px-5">
          <Logo />
        </Link>

        <NavSidebarLinks items={nav} />

        <div className="mt-auto flex flex-col gap-1 border-t border-black/5 px-3 pt-4 dark:border-white/10">
          <span className="truncate px-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            {name}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-black/5 bg-white/85 backdrop-blur md:hidden dark:border-white/10 dark:bg-black/60">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href={home}>
              <Logo />
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
              >
                Sign out
              </button>
            </form>
          </div>

          <NavTabLinks items={nav} />
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 pb-24 md:py-8">
          <InstallPrompt />
          {children}
        </main>
      </div>
    </div>
  )
}
