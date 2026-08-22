/**
 * The places a tape measure goes, and where they sit on the body diagram.
 *
 * Plain module on purpose. This data is read by the diagram (a client
 * component) and by the history table (a server component), and a value
 * exported from a "use client" file arrives on the server as a client
 * reference rather than the array itself — which fails only at runtime.
 *
 * Positions are in the diagram's 100 × 220 viewBox, laid out as the reader sees
 * them: the subject faces us, so their left side is on the right of the drawing.
 */
export type Site = {
  /** Form field name, camelCase. */
  name: string
  label: string
  x: number
  y: number
}

export const SITES: Site[] = [
  { name: 'chestCm', label: 'Chest', x: 50, y: 62 },
  { name: 'waistCm', label: 'Waist', x: 50, y: 86 },
  { name: 'hipsCm', label: 'Hips', x: 50, y: 106 },
  { name: 'upperArmRightCm', label: 'Upper arm, right', x: 27, y: 70 },
  { name: 'upperArmLeftCm', label: 'Upper arm, left', x: 73, y: 70 },
  { name: 'thighRightCm', label: 'Thigh, right', x: 39, y: 133 },
  { name: 'thighLeftCm', label: 'Thigh, left', x: 61, y: 133 },
  { name: 'aboveKneeRightCm', label: 'Above knee, right', x: 39, y: 160 },
  { name: 'aboveKneeLeftCm', label: 'Above knee, left', x: 61, y: 160 },
]

/** upperArmLeftCm → upper_arm_left_cm */
export function siteColumn(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}
