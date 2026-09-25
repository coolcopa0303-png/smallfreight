// Clean view models consumed by components. Produced by src/adapters/*.

export type ShipmentStatus =
  | 'pending'
  | 'inTransit'
  | 'atPort'
  | 'customs'
  | 'outForDelivery'
  | 'delivered'
  | 'exception'

/** Ordered tracking milestones shown in list progress + detail timeline. */
export type MilestoneKey = 'booked' | 'inTransit' | 'atPort' | 'customs' | 'outForDelivery' | 'delivered'

export interface Milestone {
  key: MilestoneKey
  state: 'done' | 'current' | 'upcoming'
  /** ISO date/time when reached (or expected, when `estimated`). */
  date?: string
  estimated?: boolean
}

export interface Place {
  city: string
  countryCode: string
  portCode?: string
  portName?: string
}

export type ServiceCode = 'isf' | 'customsEntry' | 'trucking' | 'freight' | 'warehouse' | 'arrivalNotice' | 'other'

export type ReleaseState = 'released' | 'notReleased' | 'na'

export interface ContainerInfo {
  number: string
  lfd?: string
  pickupDate?: string
  deliverDate?: string
  emptyReturnDate?: string
  emptyNotificationDate?: string
}

export type LfdLevel = 'normal' | 'warning' | 'danger'

export interface StatusEvent {
  text: string
  time: string
}

export interface ShipmentAlert {
  kind: 'lfdSoon' | 'lfdPast' | 'isfBillNotOnFile' | 'urgent'
  date?: string
}

export interface Shipment {
  id: string
  smNumber: string
  mbl?: string
  hbl?: string
  containers: string[]
  reference?: string
  isfNumber?: string
  mode: 'FCL' | 'LCL'
  transport: 'ocean' | 'truck'
  services: ServiceCode[]
  origin?: Place
  destination?: Place
  etd?: string
  eta?: string
  status: ShipmentStatus
  /** Customs-only case whose broker work is complete (old "CASE DONE"). */
  completed: boolean
  milestones: Milestone[]
  lastUpdated?: string
  lastEvent?: string
  events: StatusEvent[]
  isf: { state: 'matched' | 'notMatched' | 'na' }
  pgaStatus?: string
  customsRelease: ReleaseState
  freightRelease: ReleaseState
  containerInfo: ContainerInfo[]
  deliverTo?: string
  appointment?: string
  alerts: ShipmentAlert[]
  isUrgent: boolean
  shipper?: string
  consignee?: string
  cargo?: {
    description?: string
    hsCode?: string
    packages?: string
    weightKg?: number
    volumeCbm?: number
    containerType?: string
    sealNumber?: string
    dangerousGoods?: boolean
  }
}

export interface StatusCounts {
  all: number
  pending: number
  inTransit: number
  atPort: number
  customs: number
  outForDelivery: number
  delivered: number
  exception: number
  active: number
}

// ---------- Quotes ----------
export type CarrierCode = 'saia' | 'arcb' | 'xpo' | 'estes' | 'uber' | 'senmart'

export interface RateOption {
  id: string
  carrier: CarrierCode
  carrierName: string
  carrierTagline: string
  available: boolean
  totalPrice?: number
  currency: 'USD'
  transitDaysMin?: number
  transitDaysMax?: number
  estimatedDelivery?: string
  expiresAt?: string
  validDays?: number
  serviceType: string
  quoteNumber?: string
  breakdown?: { label: string; amount: number }[]
}

export interface QuoteResult {
  quotationId?: string
  quotationNumber?: string
  rates: RateOption[]
}

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Location {
  zip: string
  city: string
  state: string
  country: string
  point?: GeoPoint
}

export interface RouteInfo {
  miles: number
  path: [number, number][]
  approximate: boolean
}

export interface DrayagePort {
  id: string
  city: string
  state: string
  zip: string
  terminal: string
  location: string
  point?: GeoPoint
  fees: { label: string; amount: number }[]
}

// ---------- HTS ----------
export interface HtsItem {
  htsCode: string
  description: string
  descriptionZh?: string
  classification?: string
  /** Ad-valorem base rate in percent, undefined when non ad-valorem (specific / compound). */
  baseRatePct?: number
  baseRateText: string
  additionalDuties: AdditionalDuty[]
  pga: string[]
  updatedAt?: string
}

export interface AdditionalDuty {
  id: string
  ratePct?: number
  label: string
  raw: string
}

export interface HtsInquiry {
  id: number
  productName: string
  productNameZh?: string
  material?: string
  description?: string
  answeredBy?: string
  createdAt: string
  answer?: { htsCode?: string; duty?: string; description?: string }
  aiAnswer?: { htsCode: string; duty: string; description: string }
  mine: boolean
}

export interface AddressEntry {
  id: string
  company?: string
  street?: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  firstName?: string
  lastName?: string
  phone?: string
  phoneExt?: string
  email?: string
}
