'use client'

import { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'

type Section = {
  /** Commit anything waiting in this section. */
  flush: () => void
  /** True while a write is in flight or an edit is still unsaved. */
  busy: () => boolean
}

type Registry = {
  /** A section offers itself; the returned function withdraws it. */
  register: (section: Section) => () => void
  /** Commit every section, and resolve once they have all landed. */
  settle: () => Promise<void>
}

const DiarySections = createContext<Registry | null>(null)

/** Give up waiting rather than hang the button on a section that is stuck. */
const SETTLE_TIMEOUT_MS = 6000
const POLL_MS = 80

/**
 * Lets one button commit the whole day.
 *
 * Sections save themselves as they are typed, which is what keeps a half-filled
 * day safe, and each is its own form so a slow write in one does not block
 * another. That independence is also why nothing could speak for all of them —
 * so they register here, and Post flushes every one and waits for the writes to
 * land before asking the server whether the day is complete. Without the wait it
 * would read the database a beat too early and call a filled-in answer missing.
 */
export function DiarySectionsProvider({ children }: { children: ReactNode }) {
  const sections = useRef(new Set<Section>())

  const register = useCallback((section: Section) => {
    sections.current.add(section)
    return () => {
      sections.current.delete(section)
    }
  }, [])

  const settle = useCallback(async () => {
    for (const section of sections.current) section.flush()

    const deadline = Date.now() + SETTLE_TIMEOUT_MS
    while (Date.now() < deadline) {
      const busy = [...sections.current].some((section) => section.busy())
      if (!busy) return
      await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    }
  }, [])

  const value = useMemo(() => ({ register, settle }), [register, settle])

  return <DiarySections.Provider value={value}>{children}</DiarySections.Provider>
}

/** Null outside the diary, so a section is still usable on its own. */
export function useDiarySections(): Registry | null {
  return useContext(DiarySections)
}
