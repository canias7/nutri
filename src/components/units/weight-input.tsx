'use client'

import { useState } from 'react'

import { Input } from '@/components/form-fields'
import { useUnits } from '@/components/units/unit-provider'
import { kgToLbOz, lbOzToKg, round, type UnitSystem } from '@/lib/units'

type Entry = {
  /** Always kilograms — the only thing that reaches the database. */
  storage: string
  /** Which units the raw values below were typed in. */
  system: UnitSystem
  kg: string
  lb: string
  oz: string
}

function fromStorage(storage: string, system: UnitSystem): Entry {
  if (storage === '') {
    return { storage: '', system, kg: '', lb: '', oz: '' }
  }
  const kg = Number(storage)
  const { lb, oz } = kgToLbOz(kg)
  return {
    storage,
    system,
    kg: String(round(kg, 1)),
    lb: String(lb),
    oz: String(oz),
  }
}

/**
 * Weight entered in kilograms, or in pounds and ounces.
 *
 * Split into two boxes for imperial rather than decimal pounds, because that is
 * how an imperial scale reads — nobody weighs 155.2 lb, they weigh 155 lb 3 oz.
 * Only kilograms are submitted, so the database never has to work out which
 * unit a bare number was in.
 */
export function WeightInput({
  id,
  name,
  storedValue,
  placeholder,
  required,
}: {
  id: string
  name: string
  storedValue?: number | null
  placeholder?: string
  required?: boolean
}) {
  const { system } = useUnits()

  const [entry, setEntry] = useState<Entry>(() =>
    fromStorage(
      storedValue === null || storedValue === undefined ? '' : String(storedValue),
      'metric',
    ),
  )

  // Switching units re-derives the boxes from the stored kilograms during
  // render, so nothing has to be synced in an effect — and a half-typed number
  // is never reformatted underneath the reader.
  const shown = entry.system === system ? entry : fromStorage(entry.storage, system)

  function setKg(raw: string) {
    if (raw === '') return setEntry({ storage: '', system, kg: '', lb: '', oz: '' })
    const kg = Number(raw)
    if (!Number.isFinite(kg)) return setEntry({ ...shown, system, kg: raw, storage: '' })
    const { lb, oz } = kgToLbOz(kg)
    setEntry({
      storage: String(round(kg, 2)),
      system,
      kg: raw,
      lb: String(lb),
      oz: String(oz),
    })
  }

  function setImperial(lbRaw: string, ozRaw: string) {
    if (lbRaw === '' && ozRaw === '') {
      return setEntry({ storage: '', system, kg: '', lb: '', oz: '' })
    }
    const lb = Number(lbRaw || 0)
    const oz = Number(ozRaw || 0)
    if (!Number.isFinite(lb) || !Number.isFinite(oz)) {
      return setEntry({ ...shown, system, lb: lbRaw, oz: ozRaw, storage: '' })
    }
    const kg = lbOzToKg(lb, oz)
    setEntry({
      storage: String(round(kg, 2)),
      system,
      kg: String(round(kg, 1)),
      lb: lbRaw,
      oz: ozRaw,
    })
  }

  // The placeholder is written in kilograms; split it so the imperial boxes get
  // a matching hint instead of a hard-coded pair that drifts from it.
  const hint =
    placeholder === undefined || !Number.isFinite(Number(placeholder))
      ? null
      : kgToLbOz(Number(placeholder))

  return (
    <div className="flex items-center gap-2">
      {system === 'metric' ? (
        <>
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder={placeholder}
            value={shown.kg}
            onChange={(event) => setKg(event.target.value)}
            required={required}
          />
          <span className="w-6 shrink-0 text-sm text-slate-500 dark:text-slate-400">kg</span>
        </>
      ) : (
        // Pounds get more room than ounces: three digits against two, and the
        // pair still has to sit inside one form column beside the unit labels.
        <>
          <span className="flex min-w-0 flex-[3] items-center gap-1.5">
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              step="1"
              placeholder={hint ? String(hint.lb) : undefined}
              aria-label="Pounds"
              value={shown.lb}
              onChange={(event) => setImperial(event.target.value, shown.oz)}
              required={required}
            />
            <span className="w-4 shrink-0 text-sm text-slate-500 dark:text-slate-400">
              lb
            </span>
          </span>
          <span className="flex min-w-0 flex-[2] items-center gap-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={15}
              step="1"
              placeholder={hint ? String(hint.oz) : undefined}
              aria-label="Ounces"
              value={shown.oz}
              onChange={(event) => setImperial(shown.lb, event.target.value)}
            />
            <span className="w-4 shrink-0 text-sm text-slate-500 dark:text-slate-400">
              oz
            </span>
          </span>
        </>
      )}

      <input type="hidden" name={name} value={shown.storage} />
    </div>
  )
}
