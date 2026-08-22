export type UnitSystem = 'metric' | 'imperial'

export const UNIT_STORAGE_KEY = 'nutri_units'

const KG_PER_LB = 0.45359237
const CM_PER_INCH = 2.54
const OZ_PER_LB = 16

/** Rounds for display without pretending to a precision the entry never had. */
export function round(value: number, places = 1): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/**
 * Lengths are stored in centimetres and scale cleanly, so one factor does it.
 *
 * Weight has no matching converter on purpose — imperial weight is two numbers,
 * not a scaled one, so it goes through kgToLbOz below. A `toDisplay` for weight
 * would only ever hand back the decimal pounds no scale has ever shown.
 */
export const length = {
  label: (system: UnitSystem) => (system === 'metric' ? 'cm' : 'in'),
  toDisplay: (cm: number, system: UnitSystem) =>
    system === 'metric' ? cm : cm / CM_PER_INCH,
  toStorage: (value: number, system: UnitSystem) =>
    system === 'metric' ? value : value * CM_PER_INCH,
}

export function formatLength(cm: number, system: UnitSystem): string {
  return `${round(length.toDisplay(cm, system), 1).toFixed(1)} ${length.label(system)}`
}

/** Whole pounds and ounces, the way an imperial scale actually reads. */
export function kgToLbOz(kg: number): { lb: number; oz: number } {
  const totalOz = (kg / KG_PER_LB) * OZ_PER_LB
  let oz = Math.round(totalOz % OZ_PER_LB)
  let lb = Math.floor(totalOz / OZ_PER_LB)

  // 15.6 oz rounds to 16, which is not an ounce reading — carry it.
  if (oz === OZ_PER_LB) {
    oz = 0
    lb += 1
  }

  return { lb, oz }
}

export function lbOzToKg(lb: number, oz: number): number {
  return (lb + oz / OZ_PER_LB) * KG_PER_LB
}

export type WeightPart = { value: string; unit: string }

/**
 * A weight split the way it would be said aloud: one part in kg, up to two in
 * imperial. Whole pounds drop the ounces and sub-pound amounts drop the pounds,
 * so nothing reads "155 lb 0 oz" or "0 lb 11 oz".
 */
export function weightParts(kg: number, system: UnitSystem): WeightPart[] {
  if (system === 'metric') return [{ value: kg.toFixed(1), unit: 'kg' }]

  const { lb, oz } = kgToLbOz(kg)
  const parts: WeightPart[] = []
  if (lb !== 0 || oz === 0) parts.push({ value: String(lb), unit: 'lb' })
  if (oz !== 0) parts.push({ value: String(oz), unit: 'oz' })
  return parts
}

export function formatWeight(kg: number, system: UnitSystem): string {
  return weightParts(kg, system)
    .map((part) => `${part.value} ${part.unit}`)
    .join(' ')
}

/** A signed change, e.g. "+1.2 kg" or "-2 lb 5 oz". */
export function formatWeightChange(kg: number, system: UnitSystem): string {
  return `${kg < 0 ? '-' : '+'}${formatWeight(Math.abs(kg), system)}`
}
