import type { MilestoneKey, Shipment } from '@/domain/types'

type T = (key: string, vars?: Record<string, string | number | undefined>) => string

export const DASH = '—'

/** "1 × 40' HC" when the container type is known, otherwise the container numbers. */
export function containerSummary(s: Shipment): string | undefined {
  const n = s.containers.length
  if (!n) return undefined
  return s.containers.join(', ')
}

/** "FCL (Ocean Freight, Customs Entry)" */
export function serviceType(s: Shipment, t: T): string {
  const services = [...new Set(s.services)].map((c) => t(`common.service.${c}`))
  return services.length ? `${s.mode} (${services.join(', ')})` : s.mode
}

/** True when the ISO string carries a time component. */
export const hasTime = (iso?: string) => !!iso && iso.length > 10

/** Label for a milestone node, using real port cities when known. */
export function milestoneLabel(s: Shipment, key: MilestoneKey, state: 'done' | 'current' | 'upcoming', t: T): string {
  const from = s.origin?.city
  const to = s.destination?.city
  if (key === 'inTransit' && from && state === 'done') return t('detail.timeline.departed', { city: from })
  if (key === 'inTransit' && from && state === 'upcoming') return t('detail.timeline.departing', { city: from })
  if (key === 'atPort' && to) return t(state === 'upcoming' ? 'detail.timeline.arriving' : 'detail.timeline.arrived', { city: to })
  if (key === 'customs') return t(state === 'upcoming' ? 'detail.timeline.customsClearance' : 'detail.timeline.customsReleased')
  return t(`status.milestone.${key}`)
}

export function modeLabel(s: Shipment, t: T) {
  return t(s.transport === 'truck' ? 'detail.timeline.truckFreight' : 'detail.timeline.oceanFreight')
}

// ---------- CSV ----------
export function toCsv(rows: [string, string][]): Blob {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n')
  return new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
