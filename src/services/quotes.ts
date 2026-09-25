import { toDrayagePort, toDrayageQuoteResult, toLtlQuoteResult } from '@/adapters/quoteAdapter'
import type { RawFtlAddress, RawQuotation, RawQuotationRequest } from '@/domain/raw'
import type { DrayagePort, Location, QuoteResult } from '@/domain/types'
import { apiGet, apiPost, apiPut } from '@/lib/api/client'

/** Accessorial codes accepted by POST /api/quotations-browser (old portal enum). */
export const LTL_ACCESSORIALS = [
  'LiftgatePickup', 'CFS', 'NotificationPriorToDelivery', 'ResidentialDelivery', 'LiftgateDeliveryHandUnload',
  'AirportPickup', 'WeekendPickup', 'LimitedAccessOnDelivery', 'InsideDelivery', 'InsidePickup', 'LimitedAccessOnPickup',
  'ResidentialPickup', 'HazardousMaterials', 'ProtectFromFreezingService', 'SortSegregateAtDestination', 'SortSegregateAtOrigin',
  'MarkingOrTagging', 'SingleShipment', 'InBondCharge', 'GroceryWarehouse', 'Overweight',
] as const
/** Shown without expanding "More options" — same set the old form showed first. */
export const LTL_COMMON_ACCESSORIALS = LTL_ACCESSORIALS.slice(0, 8)

export const HANDLING_TYPES = ['PLT', 'SKD', 'CTN', 'BX', 'CRT', 'DR', 'PC', 'RL', 'BDL', 'BAG', 'TOTE'] as const

export interface LtlQuoteInput {
  pickupDate: string
  origin: Location
  destination: Location
  weight: number
  weightUnit: 'LBS' | 'KGS'
  pieces: number
  length: number
  width: number
  height: number
  dimUnit: 'IN' | 'FT' | 'CM' | 'M'
  handlingType: string
  description?: string
  accessorials: string[]
}

const emptyExtras = {
  excessiveLengthFeet: null, excessiveLengthInch: null, excessiveTotalInch: null, coverageAmount: null, coverageType: null,
  limitedAccessPickUpType: null, limitedAccessDeliveryType: null, tradeShowDeliveryType: null, sortPieces: null, otherAccessorial: '',
}

export async function requestLtlQuote(i: LtlQuoteInput): Promise<QuoteResult> {
  const body: RawQuotationRequest = {
    type: 'LTL',
    paymentTerms: 'Prepaid',
    shippingDate: i.pickupDate,
    originCity: i.origin.city, originState: i.origin.state, originZip: i.origin.zip, originCountry: i.origin.country,
    destinationCity: i.destination.city, destinationState: i.destination.state, destinationZip: i.destination.zip, destinationCountry: i.destination.country,
    ...emptyExtras,
    accessorials: i.accessorials,
    // Old API takes weight per line; pieces map to quantity of identical handling units.
    shipments: [{
      weight: String(i.weight), units: i.weightUnit, description: i.description ?? '',
      length: String(i.length), width: String(i.width), height: String(i.height), freightUnits: i.dimUnit,
      handlingType: i.handlingType, quantity: i.pieces,
    }],
    ftlAddressId: null,
    ftlShipments: null,
  }
  return toLtlQuoteResult(await apiPost<RawQuotation>('/api/quotations-browser', body))
}

export const CONTAINER_TYPES = [
  { id: '20', labelKey: 'quotes.container.20', maxLbs: 36000 },
  { id: '40', labelKey: 'quotes.container.40', maxLbs: 44000 },
  { id: '40HC', labelKey: 'quotes.container.40hc', maxLbs: 44000 },
  { id: '45', labelKey: 'quotes.container.45', maxLbs: 44000 },
] as const
export type ContainerTypeId = (typeof CONTAINER_TYPES)[number]['id']

export interface DrayageQuoteInput {
  portId: string
  destination: Location
  containerType: ContainerTypeId
  pickupDate: string
  direction: 'IMPORT' | 'EXPORT'
  weight?: number
  weightUnit: 'LBS' | 'KGS'
  description?: string
  residentialDelivery: boolean
  other?: string
}

export async function requestDrayageQuote(i: DrayageQuoteInput): Promise<QuoteResult> {
  const body: RawQuotationRequest = {
    type: 'FTL',
    paymentTerms: 'Prepaid',
    shippingDate: i.pickupDate,
    // Origin of an FTL quote is the terminal (ftlAddressId); the old form sent empty origin fields.
    originCity: '', originState: '', originZip: '', originCountry: 'US',
    direction: i.direction,
    destinationCity: i.destination.city, destinationState: i.destination.state, destinationZip: i.destination.zip, destinationCountry: i.destination.country,
    ...emptyExtras,
    otherAccessorial: i.other ?? '',
    accessorials: i.residentialDelivery ? ['ResidentialDelivery'] : [],
    shipments: [],
    ftlAddressId: i.portId,
    ftlShipments: [{ weight: String(i.weight ?? ''), units: i.weightUnit, class: i.containerType === '40HC' ? '40' : i.containerType, description: i.description ?? '' }],
  }
  return toDrayageQuoteResult(await apiPost<RawQuotation>('/api/quotations-browser', body))
}

export async function fetchDrayagePorts(): Promise<DrayagePort[]> {
  const raw = await apiGet<RawFtlAddress[]>('/api/ftl-addresses')
  return raw.map(toDrayagePort).sort((a, b) => a.city.localeCompare(b.city) || a.terminal.localeCompare(b.terminal))
}

/** Old portal validates the delivery ZIP against the terminal before quoting. */
export async function checkDrayageDestination(zip: string, originId: string) {
  return apiGet<{ city: string; state: string } | undefined>(`/api/ftl-addresses/destination?${new URLSearchParams({ zip, originId })}`)
}

export interface QuoteHistoryItem {
  id: string
  number: string
  type: 'LTL' | 'FTL'
  shippingDate: string
  origin: string
  destination: string
}

export async function fetchQuoteHistory(type: 'LTL' | 'FTL', keyword = ''): Promise<QuoteHistoryItem[]> {
  const qs = new URLSearchParams({ type })
  if (keyword) qs.set('keyword', keyword)
  const raw = await apiGet<RawQuotation[]>(`/api/quotations-browser/summary?${qs}`)
  return raw.map((q) => ({
    id: q.id,
    number: q.number,
    type: q.type,
    shippingDate: q.shippingDate,
    origin: [q.originCity, q.originState, q.originZip].filter(Boolean).join(', '),
    destination: [q.destinationCity, q.destinationState, q.destinationZip].filter(Boolean).join(', '),
  }))
}

export async function fetchQuotation(id: string): Promise<{ raw: RawQuotation; result: QuoteResult }> {
  const raw = await apiGet<RawQuotation>(`/api/quotations-browser/${id}`)
  return { raw, result: raw.type === 'FTL' ? toDrayageQuoteResult(raw) : toLtlQuoteResult(raw) }
}

export const toggleQuotationVisible = (id: string) => apiPut<unknown>(`/api/quotations-browser/${id}/visible`)
