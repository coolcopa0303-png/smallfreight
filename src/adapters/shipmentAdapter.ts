import type { RawCargo, RawPlace } from '@/domain/raw'
import { CARGO_TYPE } from '@/domain/raw'
import { deriveStatus, matchesTab, STATUS_TABS } from '@/domain/statusMap'
import type {
  ContainerInfo,
  LfdLevel,
  Place,
  ReleaseState,
  ServiceCode,
  Shipment,
  ShipmentAlert,
  StatusCounts,
} from '@/domain/types'

const SERVICE_BY_CODE: Record<number, ServiceCode> = {
  [CARGO_TYPE.Isf]: 'isf',
  [CARGO_TYPE.CustomEntry]: 'customsEntry',
  [CARGO_TYPE.Trucking]: 'trucking',
  [CARGO_TYPE.Freight]: 'freight',
  [CARGO_TYPE.Warehouse]: 'warehouse',
  [CARGO_TYPE.ArrivalNotices]: 'arrivalNotice',
  [CARGO_TYPE.Other]: 'other',
}

const release = (v: boolean | null): ReleaseState => (v === true ? 'released' : v === false ? 'notReleased' : 'na')
const clean = (s: string | null | undefined) => (s && s.trim() ? s.trim() : undefined)

function toPlace(p?: RawPlace): Place | undefined {
  if (!p) return undefined
  return { city: p.city, countryCode: p.country, portCode: p.code, portName: p.port }
}

const DAY = 86400000

/** LFD rule (spec §9.5): >2 days normal, 0–2 days warning, past due danger. */
export function lfdLevel(lfd: string | undefined, now: Date = new Date()): LfdLevel | undefined {
  if (!lfd) return undefined
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const diff = Math.round((Date.parse(lfd) - today) / DAY)
  if (diff < 0) return 'danger'
  if (diff <= 2) return 'warning'
  return 'normal'
}

export function toShipment(raw: RawCargo, now: Date = new Date()): Shipment {
  const { status, completed, milestones } = deriveStatus(raw, now)
  const containers = raw.containers.filter(Boolean)
  const containerInfo: ContainerInfo[] = containers.map((number) => {
    const d = raw.containerDates?.[number] ?? {}
    return {
      number,
      lfd: clean(d.lfd),
      pickupDate: clean(d.pickupDate),
      deliverDate: clean(d.deliverDate),
      emptyReturnDate: clean(d.emptyReturnDate),
      emptyNotificationDate: clean(d.emptyNotificationDate),
    }
  })

  const alerts: ShipmentAlert[] = []
  if (status !== 'delivered') {
    for (const c of containerInfo) {
      if (c.pickupDate) continue
      const level = lfdLevel(c.lfd, now)
      if (level === 'danger') alerts.push({ kind: 'lfdPast', date: c.lfd })
      else if (level === 'warning') alerts.push({ kind: 'lfdSoon', date: c.lfd })
    }
  }
  if (raw.isfStatus === false) alerts.push({ kind: 'isfBillNotOnFile' })
  if (raw.isUrgent) alerts.push({ kind: 'urgent' })

  const events = raw.statusItems.map((s) => ({ text: s.content.trim(), time: s.time }))
  const services = raw.types.map((t) => SERVICE_BY_CODE[t] ?? 'other')

  return {
    id: String(raw.id),
    smNumber: raw.displayId,
    mbl: clean(raw.mbl),
    hbl: clean(raw.hbl),
    containers,
    reference: clean(raw.ref),
    isfNumber: clean(raw.isf),
    mode: clean(raw.hbl) && containers.length === 0 ? 'LCL' : 'FCL',
    transport: services.includes('trucking') && !raw.pol ? 'truck' : 'ocean',
    services,
    origin: toPlace(raw.pol),
    destination: toPlace(raw.pod),
    etd: clean(raw.etd),
    eta: clean(raw.eta),
    status,
    completed,
    milestones,
    lastUpdated: events[0]?.time,
    lastEvent: events[0]?.text,
    events,
    isf: { state: raw.isfStatus === true ? 'matched' : raw.isfStatus === false ? 'notMatched' : 'na' },
    pgaStatus: clean(raw.pgaStatus),
    customsRelease: release(raw.customReleased),
    freightRelease: release(raw.freightReleased),
    containerInfo,
    deliverTo: clean(raw.deliverTo),
    appointment: clean(raw.appointment),
    alerts,
    isUrgent: raw.isUrgent,
    shipper: raw.shipper,
    consignee: raw.consignee,
    cargo: raw.cargo,
  }
}

export function countByStatus(list: Shipment[]): StatusCounts {
  const c: StatusCounts = { all: list.length, pending: 0, inTransit: 0, atPort: 0, customs: 0, outForDelivery: 0, delivered: 0, exception: 0, active: 0 }
  for (const s of list) {
    c[s.status] += 1
    if (s.status !== 'delivered') c.active += 1
  }
  return c
}

export function tabCounts(list: Shipment[]) {
  return Object.fromEntries(STATUS_TABS.map((t) => [t, list.filter((s) => matchesTab(s.status, t)).length])) as Record<
    (typeof STATUS_TABS)[number],
    number
  >
}

export type SearchField = 'all' | 'bl' | 'hbl' | 'container' | 'booking' | 'po' | 'reference'

/** Client-side search across the identifiers customers use (spec §6.2). */
export function matchesSearch(s: Shipment, query: string, field: SearchField = 'all'): boolean {
  const q = query.trim().toUpperCase()
  if (!q) return true
  const fields: Record<Exclude<SearchField, 'all'>, (string | undefined)[]> = {
    bl: [s.mbl],
    hbl: [s.hbl],
    container: s.containers,
    booking: [s.smNumber],
    po: [s.reference],
    reference: [s.reference, s.isfNumber],
  }
  const pool =
    field === 'all'
      ? [...Object.values(fields).flat(), s.destination?.city, s.origin?.city, s.deliverTo]
      : fields[field]
  return pool.some((v) => v && v.toUpperCase().includes(q))
}
