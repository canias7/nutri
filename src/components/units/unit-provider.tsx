'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

import { UNIT_STORAGE_KEY, type UnitSystem } from '@/lib/units'

/** Fired when the preference changes in this tab; `storage` only covers others. */
const UNIT_EVENT = 'nutri:units'

function read(): UnitSystem {
  try {
    const stored = window.localStorage.getItem(UNIT_STORAGE_KEY)
    return stored === 'imperial' ? 'imperial' : 'metric'
  } catch {
    // Private browsing, or site data blocked.
    return 'metric'
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(UNIT_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(UNIT_EVENT, onChange)
  }
}

/**
 * Which units the reader enters in.
 *
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect. That
 * also gives a defined server snapshot — metric — so the first paint matches on
 * both sides and a stored preference applies without a hydration mismatch.
 *
 * The preference is per-device on purpose: it is about this screen, not
 * something a nutritionist needs to know, and what gets stored is metric either
 * way.
 */
export function useUnits() {
  const system = useSyncExternalStore<UnitSystem>(subscribe, read, () => 'metric')

  const setSystem = useCallback((next: UnitSystem) => {
    try {
      window.localStorage.setItem(UNIT_STORAGE_KEY, next)
    } catch {
      // The preference just will not persist; this session still works.
    }
    window.dispatchEvent(new Event(UNIT_EVENT))
  }, [])

  return { system, setSystem }
}

/** Kept so the client area has one obvious place to wrap, if this ever needs context. */
export function UnitProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function UnitToggle() {
  const { system, setSystem } = useUnits()

  return (
    <div
      role="group"
      aria-label="Units"
      className="inline-flex rounded-lg border border-black/10 p-0.5 dark:border-white/15"
    >
      {(['metric', 'imperial'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setSystem(option)}
          aria-pressed={system === option}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            system === option
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
          }`}
        >
          {option === 'metric' ? 'kg / cm' : 'lb / in'}
        </button>
      ))}
    </div>
  )
}
