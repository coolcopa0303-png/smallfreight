import type { DrayagePort, Location, RateOption } from '@/domain/types'

export type QuoteKind = 'ltl' | 'drayage'
export type SortKey = 'price' | 'transit' | 'carrier'

export interface SummaryRow {
  label: string
  value: string
  /** Picks the icon shown in the result-screen summary bar; text-only places ignore it. */
  icon?: SummaryIcon
}

export type SummaryIcon = 'origin' | 'destination' | 'date' | 'weight' | 'pieces' | 'dims' | 'class' | 'note'

export type QuoteStatus = 'idle' | 'loading' | 'done' | 'error'

/** Local calendar date as YYYY-MM-DD, `offset` days from today. */
export function isoDay(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const formatLocation = (l: Location) => `${l.city}, ${l.state} ${l.zip}`
export const cityState = (l: Location) => `${l.city}, ${l.state}`

/** Leaflet tooltips render strings as HTML — escape API-provided text. */
export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function sortRates(rates: RateOption[], key: SortKey) {
  const avail = (r: RateOption) => (r.available ? 0 : 1)
  return [...rates].sort((a, b) => {
    // Unavailable rates always go last but never disappear (spec §19).
    const d = avail(a) - avail(b)
    if (d) return d
    if (key === 'price') return (a.totalPrice ?? Infinity) - (b.totalPrice ?? Infinity)
    if (key === 'transit') return (a.transitDaysMin ?? 99) - (b.transitDaysMin ?? 99) || (a.totalPrice ?? 0) - (b.totalPrice ?? 0)
    return a.carrierName.localeCompare(b.carrierName)
  })
}

/** min–max transit across available rates. */
export function transitSpan(rates: RateOption[] | undefined): [number, number] | undefined {
  const r = rates?.filter((x) => x.available && x.transitDaysMin !== undefined)
  if (!r?.length) return undefined
  return [Math.min(...r.map((x) => x.transitDaysMin!)), Math.max(...r.map((x) => x.transitDaysMax ?? x.transitDaysMin!))]
}

/** Rough transit before quotes arrive (≈450 truck miles / day). */
export function estimateTransit(miles: number, kind: QuoteKind): [number, number] {
  if (kind === 'drayage') return miles > 120 ? [2, 3] : [1, 2]
  const base = Math.ceil(miles / 450) + 1
  return [base, base + 1]
}

export function parseDims(s?: string | null) {
  const m = s?.trim().match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)$/i)
  return m ? { length: m[1], width: m[2], height: m[3] } : undefined
}

/** Whole-dollar display when the amount is whole ($325), cents otherwise ($412.50). */
export const moneyDigits = (n?: number) => (n !== undefined && Number.isInteger(n) ? 0 : 2)

type T = (key: string, vars?: Record<string, string | number | undefined>) => string

export function daysLabel(t: T, min?: number, max?: number, spaced = false) {
  if (min === undefined) return '—'
  if (max === undefined || max === min) return min === 1 ? t('common.units.day') : t('common.units.days', { count: min })
  const s = t('common.units.daysRange', { min, max })
  return spaced ? s.replace('–', ' – ') : s
}

/** "Los Angeles — Port of LA" (terminal names alone repeat across cities). */
export const portLabel = (p: DrayagePort) => {
  const term = shortTerminal(p)
  return term && term.toLowerCase() !== p.city.toLowerCase() ? `${p.city} — ${term}` : p.city
}

/** "Port of LA(APM/Everport/…)" → "Port of LA" for map labels / route details. */
export const shortTerminal = (p: DrayagePort) => p.terminal.replace(/\s*\(.*\)\s*$/, '').trim() || p.terminal
