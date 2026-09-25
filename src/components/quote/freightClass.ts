// NMFC density-based freight classes (standard published density chart, lb/ft³).
// The old quotation API has no class field — the class is shown for guidance only and never sent.

export const FREIGHT_CLASSES: { cls: string; min: number; max?: number }[] = [
  { cls: '50', min: 50 },
  { cls: '55', min: 35, max: 50 },
  { cls: '60', min: 30, max: 35 },
  { cls: '65', min: 22.5, max: 30 },
  { cls: '70', min: 15, max: 22.5 },
  { cls: '77.5', min: 13.5, max: 15 },
  { cls: '85', min: 12, max: 13.5 },
  { cls: '92.5', min: 10.5, max: 12 },
  { cls: '100', min: 9, max: 10.5 },
  { cls: '110', min: 8, max: 9 },
  { cls: '125', min: 7, max: 8 },
  { cls: '150', min: 6, max: 7 },
  { cls: '175', min: 5, max: 6 },
  { cls: '200', min: 4, max: 5 },
  { cls: '250', min: 3, max: 4 },
  { cls: '300', min: 2, max: 3 },
  { cls: '400', min: 1, max: 2 },
  { cls: '500', min: 0, max: 1 },
]

const TO_INCH = { IN: 1, FT: 12, CM: 1 / 2.54, M: 100 / 2.54 } as const
export type DimUnit = keyof typeof TO_INCH

export function estimateClass(opts: {
  weight: number
  weightUnit: 'LBS' | 'KGS'
  pieces: number
  length: number
  width: number
  height: number
  dimUnit: DimUnit
}) {
  const { weight, weightUnit, pieces, length, width, height, dimUnit } = opts
  if (!(weight > 0 && pieces > 0 && length > 0 && width > 0 && height > 0)) return undefined
  const k = TO_INCH[dimUnit]
  const cuFt = ((length * k * width * k * height * k) / 1728) * pieces
  const lbs = weightUnit === 'KGS' ? weight * 2.20462 : weight
  const density = lbs / cuFt
  const match = FREIGHT_CLASSES.find((c) => density >= c.min && (c.max === undefined || density < c.max)) ?? FREIGHT_CLASSES[FREIGHT_CLASSES.length - 1]
  return { cls: match.cls, density: Math.round(density * 10) / 10, cuFt: Math.round(cuFt * 10) / 10 }
}
