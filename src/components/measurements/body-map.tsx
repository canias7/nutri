'use client'

import { SITES } from '@/lib/client/measurement-sites'

export function BodyMap({
  active,
  onSelect,
}: {
  active: string | null
  onSelect: (name: string) => void
}) {
  return (
    <svg
      viewBox="0 0 100 220"
      className="h-72 w-full"
      role="group"
      aria-label="Body diagram — choose where you measured"
    >
      <g
        className="text-slate-300 dark:text-white/20"
        fill="currentColor"
        stroke="none"
      >
        <circle cx="50" cy="20" r="11" />
        <rect x="46" y="30" width="8" height="7" rx="3" />
        {/* Torso */}
        <path d="M34 38h32c3 0 5 2 5 5l-2 30-3 38H34l-3-38-2-30c0-3 2-5 5-5Z" />
        {/* Arms */}
        <path d="M32 40c-6 2-8 6-9 12l-3 30c-.5 4 5 5 6 1l4-24 4-13Z" />
        <path d="M68 40c6 2 8 6 9 12l3 30c.5 4-5 5-6 1l-4-24-4-13Z" />
        {/* Legs */}
        <path d="M37 113h11l-1 45-2 46c-.5 4-7 4-7 0l-2-46-1-45Z" />
        <path d="M52 113h11l-1 45-2 46c-.5 4-7 4-7 0l-2-46-1-45Z" />
      </g>

      {SITES.map((site) => {
        const isActive = active === site.name
        return (
          <g key={site.name}>
            <circle
              cx={site.x}
              cy={site.y}
              r={isActive ? 6 : 4.5}
              className={
                isActive
                  ? 'fill-emerald-600 stroke-white dark:stroke-slate-900'
                  : 'fill-white stroke-emerald-600 dark:fill-slate-900'
              }
              strokeWidth="2"
            />
            {/* A generous invisible target, so a fingertip does not have to be precise. */}
            <circle
              cx={site.x}
              cy={site.y}
              r="11"
              fill="transparent"
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={site.label}
              onClick={() => onSelect(site.name)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(site.name)
                }
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}
