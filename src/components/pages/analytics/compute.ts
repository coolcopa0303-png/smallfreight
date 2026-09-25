import type { StatusTone } from '@/domain/statusMap'
import { STATUS_META } from '@/domain/statusMap'
import type { ServiceCode, Shipment, ShipmentStatus } from '@/domain/types'

const DAY = 86400000

export interface Kpis {
  total: number
  active: number
  delivered: number
  completed: number
  avgDaysToRelease?: number
  releaseSample: number
}

function time(iso?: string) {
  if (!iso) return undefined
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T00:00:00Z') : new Date(iso)
  const t = d.getTime()
  return Number.isNaN(t) ? undefined : t
}

/** Days from case open (booked) to customs release, only when both dates are actual (not estimated). */
export function daysToRelease(s: Shipment): number | undefined {
  const booked = s.milestones.find((m) => m.key === 'booked')
  const customs = s.milestones.find((m) => m.key === 'customs')
  if (!booked || !customs || booked.estimated || customs.estimated) return undefined
  const a = time(booked.date)
  const b = time(customs.date)
  if (a === undefined || b === undefined || b < a) return undefined
  return (b - a) / DAY
}

export function computeKpis(list: Shipment[]): Kpis {
  let active = 0
  let delivered = 0
  let completed = 0
  let sum = 0
  let n = 0
  for (const s of list) {
    if (s.status === 'delivered') {
      delivered += 1
      if (s.completed) completed += 1
    } else active += 1
    const d = daysToRelease(s)
    if (d !== undefined) {
      sum += d
      n += 1
    }
  }
  return { total: list.length, active, delivered, completed, avgDaysToRelease: n ? sum / n : undefined, releaseSample: n }
}

export interface MonthBucket {
  key: string // YYYY-MM
  year: number
  month: number // 0-11
  count: number
  current: boolean
}

/** ETA counts for the last `back` months, the current month and the next `ahead` months (UTC). */
export function etaByMonth(list: Shipment[], now: Date = new Date(), back = 6, ahead = 2): MonthBucket[] {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const buckets: MonthBucket[] = []
  for (let i = -back; i <= ahead; i++) {
    const d = new Date(Date.UTC(y, m + i, 1))
    const key = d.toISOString().slice(0, 7)
    buckets.push({ key, year: d.getUTCFullYear(), month: d.getUTCMonth(), count: 0, current: i === 0 })
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]))
  for (const s of list) {
    const i = s.eta ? index.get(s.eta.slice(0, 7)) : undefined
    if (i !== undefined) buckets[i].count += 1
  }
  return buckets
}

export const TONE_COLOR: Record<StatusTone, string> = {
  blue: 'var(--brand-primary)',
  orange: 'var(--warning)',
  purple: 'var(--purple)',
  green: 'var(--success)',
  gray: 'var(--neutral)',
  red: 'var(--danger)',
}

export interface BarRow {
  key: string
  labelKey: string
  count: number
  color: string
}

const STATUS_ORDER: ShipmentStatus[] = ['pending', 'inTransit', 'atPort', 'customs', 'outForDelivery', 'delivered', 'exception']

/** Status rows; customs-only "completed" files are split out of delivered, as StatusChip shows them. */
export function statusRows(list: Shipment[]): BarRow[] {
  const counts = new Map<string, number>()
  for (const s of list) {
    const k = s.status === 'delivered' && s.completed ? 'completed' : s.status
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const rows: BarRow[] = []
  for (const st of STATUS_ORDER) {
    const meta = STATUS_META[st]
    rows.push({ key: st, labelKey: meta.labelKey, count: counts.get(st) ?? 0, color: TONE_COLOR[meta.tone] })
    if (st === 'delivered') rows.push({ key: 'completed', labelKey: 'status.completed', count: counts.get('completed') ?? 0, color: TONE_COLOR.green })
  }
  return rows
}

const SERVICE_ORDER: ServiceCode[] = ['isf', 'customsEntry', 'trucking', 'freight', 'warehouse', 'arrivalNotice', 'other']

/** Shipments using each service (a shipment can use several), sorted by count. */
export function serviceRows(list: Shipment[]): BarRow[] {
  return SERVICE_ORDER.map((code) => ({
    key: code,
    labelKey: `common.service.${code}`,
    count: list.filter((s) => s.services.includes(code)).length,
    color: 'var(--brand-primary)',
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function splitCounts<K extends string>(list: Shipment[], pick: (s: Shipment) => K, keys: K[]) {
  return keys.map((k) => ({ key: k, count: list.filter((s) => pick(s) === k).length }))
}
