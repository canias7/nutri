'use client'

import { LengthText, WeightText } from '@/components/units/readouts'
import { formatWeightChange, length, round, type UnitSystem } from '@/lib/units'
import { useUnits } from '@/components/units/unit-provider'

/** Movement worth showing — below this it is the tape measure, not the body. */
const NOTICEABLE = 0.05

function change(delta: number, measure: 'weight' | 'length', system: UnitSystem) {
  if (measure === 'weight') return formatWeightChange(delta, system)
  const shown = round(length.toDisplay(delta, system), 1).toFixed(1)
  return delta > 0 ? `+${shown}` : shown
}

/**
 * One number in the history grid, in the reader's units, with its movement since
 * the set before. A `<td>` from a client component so the conversion can happen
 * on the reader's device — the page itself is rendered on the server, where the
 * preference is not known.
 */
export function MeasureCell({
  value,
  before,
  measure = 'length',
}: {
  value: number | null
  before?: number | null
  measure?: 'weight' | 'length'
}) {
  const { system } = useUnits()

  if (value === null) {
    return <td className="px-4 py-2.5 text-slate-400 dark:text-slate-600">—</td>
  }

  const delta =
    before === null || before === undefined ? null : Number(value) - Number(before)

  return (
    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
      {measure === 'weight' ? (
        <WeightText kg={Number(value)} unitClassName="ml-1 text-xs text-slate-500" />
      ) : (
        <LengthText cm={Number(value)} showUnit={false} />
      )}
      {delta !== null && Math.abs(delta) >= NOTICEABLE ? (
        <span
          className={`ml-1.5 text-xs font-medium ${
            delta < 0
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {change(delta, measure, system)}
        </span>
      ) : null}
    </td>
  )
}
