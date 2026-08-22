'use client'

import { useUnits } from '@/components/units/unit-provider'
import {
  formatLength,
  formatWeightChange,
  length,
  round,
  weightParts,
} from '@/lib/units'

/** The muted unit suffix the big figures use; rows usually want plain `ml-1`. */
export const UNIT_SUFFIX = 'ml-1 text-sm font-medium text-slate-500 dark:text-slate-400'

/**
 * A stored weight, shown in whichever units the reader chose.
 *
 * The server snapshot behind useUnits is metric, so this renders kilograms on
 * the server and swaps to pounds after hydration — no mismatch, and no per-reader
 * preference baked into a server render. Entering in pounds and reading back in
 * kilograms was the alternative, and it makes the toggle a lie.
 */
export function WeightText({
  kg,
  unitClassName = 'ml-1',
}: {
  kg: number
  unitClassName?: string
}) {
  const { system } = useUnits()

  return (
    <>
      {weightParts(kg, system).map((part, index) => (
        <span key={part.unit}>
          {index > 0 ? ' ' : null}
          {part.value}
          <span className={unitClassName}>{part.unit}</span>
        </span>
      ))}
    </>
  )
}

/** A stored length in the reader's units. */
export function LengthText({
  cm,
  unitClassName = 'ml-1',
  showUnit = true,
}: {
  cm: number
  unitClassName?: string
  showUnit?: boolean
}) {
  const { system } = useUnits()
  const value = round(length.toDisplay(cm, system), 1).toFixed(1)

  return showUnit ? (
    <>
      {value}
      <span className={unitClassName}>{length.label(system)}</span>
    </>
  ) : (
    <>{value}</>
  )
}

/** A signed weight change, e.g. "+1.2 kg" or "-2 lb 5 oz". */
export function WeightChangeText({ kg }: { kg: number }) {
  const { system } = useUnits()
  return <>{formatWeightChange(kg, system)}</>
}

/** Names the units for a column of bare numbers that carries no suffix itself. */
export function LengthUnitName() {
  const { system } = useUnits()
  return <>{system === 'metric' ? 'centimetres' : 'inches'}</>
}

/** The plain-text forms, for aria-labels and anywhere a string is needed. */
export function useWeightFormatter() {
  const { system } = useUnits()
  return {
    system,
    weight: (kg: number) =>
      weightParts(kg, system)
        .map((part) => `${part.value} ${part.unit}`)
        .join(' '),
    change: (kg: number) => formatWeightChange(kg, system),
    length: (cm: number) => formatLength(cm, system),
  }
}
