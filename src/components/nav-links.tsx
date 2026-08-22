'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export type NavItem = { href: string; label: string; badge?: number }

/**
 * Small line icons keyed by route. A sidebar of bare text is hard to scan at a
 * glance, which is the whole reason for moving the nav out of the top bar.
 */
const ICONS: Record<string, ReactNode> = {
  '/dashboard': (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  '/diary': (
    <>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
    </>
  ),
  '/supplements': (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-30 12 12)" />
      <path d="M9 15 15 9" strokeLinecap="round" />
    </>
  ),
  '/messages': (
    <path
      d="M20 14.5a2 2 0 0 1-2 2H8l-4 3.5v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8.5Z"
      strokeLinejoin="round"
    />
  ),
  '/profile': (
    <>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </>
  ),
}

function Icon({ href }: { href: string }) {
  const paths = ICONS[href]
  if (!paths) return null
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      {paths}
    </svg>
  )
}

function Badge({ count }: { count: number }) {
  return (
    <span
      className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white tabular-nums"
      aria-label={`${count} unread`}
    >
      {count}
    </span>
  )
}

function useActive(href: string) {
  const pathname = usePathname()
  // The section root would otherwise match every page beneath it.
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Vertical list for the desktop sidebar. */
export function NavSidebarLinks({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex-1 px-3">
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const active = useActive(item.href)

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100'
      }`}
    >
      <Icon href={item.href} />
      <span className="truncate">{item.label}</span>
      {item.badge ? <Badge count={item.badge} /> : null}
    </Link>
  )
}

/** Horizontal scrolling tabs, kept for phones where a sidebar has nowhere to go. */
export function NavTabLinks({ items }: { items: NavItem[] }) {
  return (
    <nav className="overflow-x-auto px-4">
      <ul className="flex gap-1 pb-1">
        {items.map((item) => (
          <li key={item.href}>
            <TabLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

function TabLink({ item }: { item: NavItem }) {
  const active = useActive(item.href)

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100'
      }`}
    >
      {item.label}
      {item.badge ? (
        <span
          className="inline-flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white tabular-nums"
          aria-label={`${item.badge} unread`}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  )
}
