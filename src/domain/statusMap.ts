// The ONLY place that interprets old-backend status signals. Pages must not re-derive status.
import type { RawCargo } from './raw'
import { CARGO_TYPE } from './raw'
import type { Milestone, MilestoneKey, ShipmentStatus } from './types'

export const MILESTONE_ORDER: MilestoneKey[] = ['booked', 'inTransit', 'atPort', 'customs', 'outForDelivery', 'delivered']

export type StatusTone = 'blue' | 'orange' | 'purple' | 'green' | 'gray' | 'red'

/** Chip colours (spec §4.5) + i18n keys. */
export const STATUS_META: Record<ShipmentStatus, { tone: StatusTone; labelKey: string }> = {
  inTransit: { tone: 'blue', labelKey: 'status.inTransit' },
  atPort: { tone: 'orange', labelKey: 'status.atPort' },
  customs: { tone: 'purple', labelKey: 'status.customs' },
  outForDelivery: { tone: 'blue', labelKey: 'status.outForDelivery' },
  delivered: { tone: 'green', labelKey: 'status.delivered' },
  pending: { tone: 'gray', labelKey: 'status.pending' },
  exception: { tone: 'red', labelKey: 'status.exception' },
}

/** Tabs on Shipment Tracking / Recent Shipments. `inTransit` tab also covers out-for-delivery. */
export const STATUS_TABS = ['all', 'inTransit', 'atPort', 'customs', 'delivered', 'pending'] as const
export type StatusTab = (typeof STATUS_TABS)[number]

export function matchesTab(status: ShipmentStatus, tab: StatusTab): boolean {
  if (tab === 'all') return true
  if (tab === 'inTransit') return status === 'inTransit' || status === 'outForDelivery'
  if (tab === 'pending') return status === 'pending' || status === 'exception'
  return status === tab
}

const has = (items: string[], re: RegExp) => items.some((s) => re.test(s))
const firstTime = (raw: RawCargo, re: RegExp) => {
  // statusItems are newest-first; the earliest match is the milestone date.
  const hits = raw.statusItems.filter((s) => re.test(s.content.toUpperCase()))
  return hits.length ? hits[hits.length - 1].time : undefined
}

const RE = {
  caseOpen: /CASE OPEN/,
  isf: /ISF FINISHED|ISF FILED/,
  arrived: /AN RCVD|ARRIV|PENDING APPT|DISCHARGED/,
  entry: /ENTRY DATA ENTERED|7501|ENTRY TRANSMIT/,
  released: /CUSTOM(S)? RELEASED/,
  pickedUp: /PICKED UP|PENDING DELIVERY|OUT FOR DELIVERY/,
  delivered: /\bDELIVERED\b|EMPTY RETURN/,
}

function todayIso(now: Date) {
  return now.toISOString().slice(0, 10)
}

export interface DerivedStatus {
  status: ShipmentStatus
  completed: boolean
  milestones: Milestone[]
}

export function deriveStatus(raw: RawCargo, now: Date = new Date()): DerivedStatus {
  const items = raw.statusItems.map((s) => s.content.toUpperCase())
  const dates = Object.values(raw.containerDates ?? {})
  const today = todayIso(now)
  const trucking = raw.types.includes(CARGO_TYPE.Trucking)

  const deliveredAt = dates.find((d) => d.deliverDate)?.deliverDate ?? firstTime(raw, RE.delivered)
  const pickedUpAt = dates.find((d) => d.pickupDate)?.pickupDate ?? firstTime(raw, RE.pickedUp)
  const released = raw.customReleased === true || has(items, RE.released)
  const releasedAt = firstTime(raw, RE.released)
  const arrived = (!!raw.eta && raw.eta <= today) || has(items, RE.arrived)
  const departed = has(items, RE.isf) || raw.isfStatus !== null || !!raw.etd
  const onlyOpened = !departed && !arrived && !released

  const isDelivered = !!deliveredAt
  // Customs-brokerage-only file: broker work ends at release once the cargo has arrived.
  const completed = !isDelivered && !trucking && released && arrived
  const outForDelivery = !isDelivered && !!pickedUpAt

  let status: ShipmentStatus
  if (isDelivered || completed) status = 'delivered'
  else if (outForDelivery) status = 'outForDelivery'
  else if (arrived && released) status = 'atPort'
  else if (arrived) status = 'customs'
  else if (onlyOpened) status = 'pending'
  else status = 'inTransit'

  if (raw.isUrgent && status !== 'delivered') status = 'exception'

  const reached: Record<MilestoneKey, boolean> = {
    booked: true,
    inTransit: departed || arrived || released,
    atPort: arrived || isDelivered || !!pickedUpAt,
    customs: released,
    outForDelivery: !!pickedUpAt || isDelivered || completed,
    delivered: isDelivered || completed,
  }
  const when: Partial<Record<MilestoneKey, { date?: string; estimated?: boolean }>> = {
    booked: { date: firstTime(raw, RE.caseOpen) },
    inTransit: { date: raw.etd ?? firstTime(raw, RE.isf) },
    atPort: { date: raw.eta ?? undefined, estimated: !arrived },
    customs: { date: releasedAt },
    outForDelivery: { date: pickedUpAt ?? undefined },
    delivered: { date: deliveredAt ?? (completed ? releasedAt : undefined) },
  }

  // Current milestone follows the shipment status (design: blue node carrying the mode icon), so the
  // progress bar never contradicts the status chip. Steps reached out of order — e.g. customs released
  // before arrival (pre-clearance) — stay "done" without back-filling the steps in between.
  const CURRENT: Record<ShipmentStatus, MilestoneKey | null> = {
    pending: 'booked',
    inTransit: 'inTransit',
    atPort: 'atPort',
    customs: 'customs',
    outForDelivery: 'outForDelivery',
    delivered: null,
    exception: null,
  }
  const furthest = [...MILESTONE_ORDER].reverse().find((k) => reached[k]) ?? 'booked'
  const currentKey = status === 'exception' ? furthest : CURRENT[status]
  const milestones: Milestone[] = MILESTONE_ORDER.map((key) => {
    const state: Milestone['state'] = key === currentKey ? 'current' : reached[key] ? 'done' : 'upcoming'
    return { key, state, ...when[key] }
  })

  return { status, completed, milestones }
}
