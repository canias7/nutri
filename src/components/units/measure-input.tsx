'use client'

import { useState } from 'react'

import { Input } from '@/components/form-fields'
import { useUnits } from '@/components/units/unit-provider'
import { round, units, type Measure } from '@/lib/units'
import type { UnitSystem } from '@/lib/units'

/**
 * A number entered in whichever units the reader prefers, submitted in metric.
 *
 * The visible field carries no name, so it never reaches the server; a hidden
 * field alongside it holds the converted value. Every unit decision stays on the
 * client and the database only ever sees kg and cm — no guessing later about
 * what a bare "62" meant.
 */
export function MeasureInput({
  id,
  name,
  measure,
  storedValue,
  placeholder,
  required,
}: {
  id: string
  name: string
  measure: Measure
  storedValue?: number | null
  placeholder?: string
  required?: boolean
}) {
  const { system } = useUnits()
  const converter = units[measure]

  // What was typed, the units it was typed in, and its metric equivalent. Held
  // together so switching units can be derived during render rather than synced
  // by an effect — and so reformatting never fights someone mid-keystroke.
  const [entry, setEntry] = useState<{
    raw: string
    system: UnitSystem
    storage: string
  }>(() => {
    const initial =
      storedValue === null || storedValue === undefined ? '' : String(storedValue)
    return { raw: initial, system: 'metric', storage: initial }
  })

  const display =
    entry.system === system
      ? entry.raw
      : entry.storage === ''
        ? ''
        : String(round(converter.toDisplay(Number(entry.storage), system), 1))

  function handleChange(raw: string) {
    if (raw === '') {
      setEntry({ raw: '', system, storage: '' })
      return
    }
    const value = Number(raw)
    const storage = Number.isFinite(value)
      ? String(round(converter.toStorage(value, system), 2))
      : ''
    setEntry({ raw, system, storage })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.1"
        placeholder={placeholder}
        value={display}
        onChange={(event) => handleChange(event.target.value)}
        required={required}
      />
      <span className="w-6 shrink-0 text-sm text-slate-500 dark:text-slate-400">
        {converter.label(system)}
      </span>
      <input type="hidden" name={name} value={entry.storage} />
    </div>
  )
}
