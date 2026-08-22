export type UnitSystem = 'metric' | 'imperial'

export const UNIT_STORAGE_KEY = 'nutri_units'

const KG_PER_LB = 0.45359237
const CM_PER_INCH = 2.54

/** Everything is stored in kg and cm; these convert only for display and entry. */
export const units = {
  weight: {
    label: (system: UnitSystem) => (system === 'metric' ? 'kg' : 'lb'),
    toDisplay: (kg: number, system: UnitSystem) =>
      system === 'metric' ? kg : kg / KG_PER_LB,
    toStorage: (value: number, system: UnitSystem) =>
      system === 'metric' ? value : value * KG_PER_LB,
  },
  length: {
    label: (system: UnitSystem) => (system === 'metric' ? 'cm' : 'in'),
    toDisplay: (cm: number, system: UnitSystem) =>
      system === 'metric' ? cm : cm / CM_PER_INCH,
    toStorage: (value: number, system: UnitSystem) =>
      system === 'metric' ? value : value * CM_PER_INCH,
  },
}

export type Measure = keyof typeof units

/** Rounds for display without pretending to a precision the entry never had. */
export function round(value: number, places = 1): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}
