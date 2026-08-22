'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = { href: string; label: string; badge?: number }

export function NavTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="mx-auto w-full max-w-4xl overflow-x-auto px-5">
      <ul className="flex gap-1 pb-1">
        {items.map((item) => {
          // The section root would otherwise match every page beneath it.
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
                {item.badge ? (
                  <span
                    className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white tabular-nums"
                    aria-label={`${item.badge} unread`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
