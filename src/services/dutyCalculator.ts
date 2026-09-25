// Duty / landed-cost ESTIMATE. The old backend has no calculator API — only HTS base rates and a
// free-text list of additional duties. This module keeps all calculation rules in one replaceable place:
//   - base duty: from /api/hts-items (ad-valorem rates only)
//   - additional duties: only the lines the user explicitly selects (never auto-applied)
//   - HMF / MPF: public CBP formulas below — PROTOTYPE CONFIG, confirm with the customs team before production.
import type { AdditionalDuty, HtsItem } from '@/domain/types'

export const FEE_RULES = {
  // Harbor Maintenance Fee: 0.125% of value, ocean shipments only.
  hmfRate: 0.00125,
  hmfModes: ['ocean'] as TransportMode[],
  // Merchandise Processing Fee (formal entry): 0.3464% with min/max per entry.
  mpfRate: 0.003464,
  mpfMin: 32.71,
  mpfMax: 651.5,
  source: 'CBP published rates (configure in services/dutyCalculator.ts)',
}

export type TransportMode = 'ocean' | 'air' | 'truck' | 'rail'

export interface ExclusionCode {
  id: string
  code: string
  note?: string
  applied: boolean
}

export interface DutyInput {
  item: HtsItem
  value: number
  mode: TransportMode
  selectedAdditional: AdditionalDuty[]
  exclusions: ExclusionCode[]
}

export interface DutyLine {
  code: string
  description: string
  ratePct?: number
  amount?: number
  kind: 'base' | 'additional' | 'fee' | 'exclusion'
  note?: string
}

export interface DutyResult {
  /** Combined ad-valorem duty rate (base + selected additional). Undefined if base is non ad-valorem. */
  dutyRatePct?: number
  totalDuties?: number
  hmf: number
  mpf: number
  landedCost?: number
  lines: DutyLine[]
  warnings: ('nonAdValorem' | 'additionalAvailable' | 'exclusionNotComputed')[]
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function calculateDuties(i: DutyInput): DutyResult {
  const lines: DutyLine[] = []
  const warnings: DutyResult['warnings'] = []
  const base = i.item.baseRatePct
  const baseAmt = base !== undefined ? r2((i.value * base) / 100) : undefined
  if (base === undefined) warnings.push('nonAdValorem')
  lines.push({ code: i.item.htsCode, description: i.item.description, ratePct: base, amount: baseAmt, kind: 'base', note: base === undefined ? i.item.baseRateText : undefined })

  let addPct = 0
  for (const a of i.selectedAdditional) {
    if (a.ratePct === undefined) continue
    addPct += a.ratePct
    lines.push({ code: a.label.match(/SECTION\s+\d+/i)?.[0].toUpperCase() ?? '—', description: a.raw, ratePct: a.ratePct, amount: r2((i.value * a.ratePct) / 100), kind: 'additional' })
  }
  if (i.item.additionalDuties.length > i.selectedAdditional.length) warnings.push('additionalAvailable')

  for (const e of i.exclusions) {
    lines.push({ code: e.code, description: e.note ?? '', kind: 'exclusion', note: e.applied ? 'applied' : 'notApplied' })
  }
  if (i.exclusions.some((e) => e.applied)) warnings.push('exclusionNotComputed')

  const hmf = FEE_RULES.hmfModes.includes(i.mode) ? r2(i.value * FEE_RULES.hmfRate) : 0
  const mpf = i.value > 0 ? r2(Math.min(FEE_RULES.mpfMax, Math.max(FEE_RULES.mpfMin, i.value * FEE_RULES.mpfRate))) : 0
  lines.push({ code: 'HMF', description: 'hmf', ratePct: FEE_RULES.hmfModes.includes(i.mode) ? FEE_RULES.hmfRate * 100 : 0, amount: hmf, kind: 'fee' })
  lines.push({ code: 'MPF', description: 'mpf', ratePct: FEE_RULES.mpfRate * 100, amount: mpf, kind: 'fee' })

  const dutyRatePct = base !== undefined ? r2(base + addPct) : undefined
  const totalDuties = dutyRatePct !== undefined ? r2((i.value * dutyRatePct) / 100) : undefined
  return {
    dutyRatePct,
    totalDuties,
    hmf,
    mpf,
    landedCost: totalDuties !== undefined ? r2(i.value + totalDuties + hmf + mpf) : undefined,
    lines,
    warnings,
  }
}
