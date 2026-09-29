import type { MilestoneKey, Shipment } from '@/domain/types'
import { PLACE_POINTS } from '@/services/geo'

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

// ---------- map geometry ----------
export interface RouteGeometry {
  from: [number, number]
  to: [number, number]
  path: [number, number][]
  at: (p: number) => [number, number]
}

/**
 * Gentle quadratic-bezier arc between two ports. Trans-Pacific routes shift the destination
 * by +360° so the line crosses the Pacific instead of Eurasia (Leaflet accepts lng > 180).
 */
export function routeGeometry(s: Shipment): RouteGeometry | undefined {
  const a = s.origin?.portCode ? PLACE_POINTS[s.origin.portCode] : undefined
  const b = s.destination?.portCode ? PLACE_POINTS[s.destination.portCode] : undefined
  if (!a || !b) return undefined
  let bLng = b.lng
  const pacific = a.lng - b.lng > 180
  if (pacific) bLng += 360
  const from: [number, number] = [a.lat, a.lng]
  const to: [number, number] = [b.lat, bLng]
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1])
  // Trans-Pacific arcs sag south like the design; other lanes bow poleward (great-circle-ish).
  const bow = dist * 0.14 * (pacific ? -1 : 1)
  const ctrl: [number, number] = [(from[0] + to[0]) / 2 + bow, (from[1] + to[1]) / 2]
  const at = (p: number): [number, number] => {
    const q = 1 - p
    return [q * q * from[0] + 2 * q * p * ctrl[0] + p * p * to[0], q * q * from[1] + 2 * q * p * ctrl[1] + p * p * to[1]]
  }
  const path = Array.from({ length: 41 }, (_, i) => at(i / 40))
  return { from, to, path, at }
}

/** Time progress between ETD and ETA (0–1), undefined when either date is missing. */
export function voyageProgress(etd?: string, eta?: string, now = Date.now()): number | undefined {
  if (!etd || !eta) return undefined
  const a = Date.parse(etd)
  const b = Date.parse(eta)
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return undefined
  return Math.min(1, Math.max(0, (now - a) / (b - a)))
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
