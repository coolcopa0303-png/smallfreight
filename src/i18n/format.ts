import type { Lang } from './dictionaries'

const DAY = 86400000

function parse(iso?: string) {
  if (!iso) return undefined
  // Date-only strings are calendar dates — keep them in UTC so they don't shift a day.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T00:00:00Z') : new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** 2026-10-25 (list/table style used in the designs). */
export function fmtIsoDate(iso?: string) {
  const d = parse(iso)
  return d ? d.toISOString().slice(0, 10) : '—'
}

/** Oct 25, 2026 / 2026年10月25日 */
export function fmtDate(iso: string | undefined, lang: Lang) {
  const d = parse(iso)
  if (!d) return '—'
  return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d)
}

export function fmtDateTime(iso: string | undefined, lang: Lang) {
  const d = parse(iso)
  if (!d) return '—'
  return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(d) + ' (UTC)'
}

export function fmtTime(iso: string | undefined) {
  const d = parse(iso)
  if (!d) return ''
  return d.toISOString().slice(11, 16)
}

/** Whole days from today (UTC) to the date; negative when past. */
export function daysFromToday(iso?: string, now: Date = new Date()) {
  const d = parse(iso)
  if (!d) return undefined
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - today) / DAY)
}

export function fmtRelative(iso: string | undefined, lang: Lang, now: Date = new Date()) {
  const d = parse(iso)
  if (!d) return '—'
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  const diff = (d.getTime() - now.getTime()) / 1000
  const abs = Math.abs(diff)
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  return rtf.format(Math.round(diff / (86400 * 30)), 'month')
}

export function fmtMoney(n: number | undefined, lang: Lang, digits = 2) {
  if (n === undefined || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
}

export function fmtNumber(n: number | undefined, lang: Lang, digits = 0) {
  if (n === undefined || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)
}

export function fmtPct(n: number | undefined, digits = 2) {
  if (n === undefined || Number.isNaN(n)) return '—'
  return `${n.toFixed(digits)}%`
}
