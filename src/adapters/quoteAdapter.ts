import type { RawFtlAddress, RawQuotation, RawVendorQuote } from '@/domain/raw'
import type { CarrierCode, DrayageFee, DrayageFeeUnit, DrayagePort, DrayageQuote, Location, QuoteResult, RateOption } from '@/domain/types'
import { TERMINAL_POINTS } from '@/services/geo'

export const CARRIERS: Record<CarrierCode, { name: string; taglineKey: string }> = {
  saia: { name: 'SAIA', taglineKey: 'quotes.carrier.ltlFreight' },
  arcb: { name: 'ABF Freight', taglineKey: 'quotes.carrier.arcbest' },
  xpo: { name: 'XPO Logistics', taglineKey: 'quotes.carrier.ltlFreight' },
  estes: { name: 'ESTES', taglineKey: 'quotes.carrier.ltlFreight' },
  uber: { name: 'Uber Freight', taglineKey: 'quotes.carrier.marketplace' },
  senmart: { name: 'SMALL FREIGHT', taglineKey: 'quotes.carrier.ownFleet' },
}

const VENDOR_KEYS: CarrierCode[] = ['saia', 'arcb', 'xpo', 'estes', 'uber', 'senmart']
const DAY = 86400000

function daysBetween(from: string, to?: string) {
  if (!to) return undefined
  const d = Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / DAY)
  return Number.isFinite(d) && d >= 0 ? d : undefined
}

function vendorRate(q: RawQuotation, carrier: CarrierCode, v: RawVendorQuote | null, serviceType: string): RateOption {
  const meta = CARRIERS[carrier]
  if (!v || !(v.totalInvoice > 0)) {
    return { id: `${q.id}-${carrier}`, carrier, carrierName: meta.name, carrierTagline: meta.taglineKey, available: false, currency: 'USD', serviceType }
  }
  const transit = daysBetween(q.shippingDate, v.estimatedDeliveryDate)
  const validDays = daysBetween(q.createdAt ?? q.shippingDate, v.expirationDate)
  return {
    id: `${q.id}-${carrier}`,
    carrier,
    carrierName: meta.name,
    carrierTagline: meta.taglineKey,
    available: true,
    totalPrice: v.totalInvoice,
    currency: 'USD',
    // Old backend returns a single estimated delivery date; show a 1-day window like the design.
    transitDaysMin: transit,
    transitDaysMax: transit !== undefined ? transit + 1 : undefined,
    estimatedDelivery: v.estimatedDeliveryDate,
    expiresAt: v.expirationDate,
    validDays,
    serviceType,
    quoteNumber: v.quoteNumber !== undefined ? String(v.quoteNumber) : undefined,
  }
}

export function toLtlQuoteResult(q: RawQuotation): QuoteResult {
  return {
    quotationId: q.id,
    quotationNumber: q.number,
    rates: VENDOR_KEYS.map((k) => vendorRate(q, k, q[k], 'standardLtl')),
  }
}

export function toDrayageQuoteResult(q: RawQuotation): QuoteResult {
  // SMALL FREIGHT's own drayage price comes from ftlPrice / ftlRate (old FCL quote page).
  const own = q.ftlPrice ?? q.ftlRate?.baseRate ?? null
  const ownRate: RateOption = own
    ? {
        id: `${q.id}-senmart`,
        carrier: 'senmart',
        carrierName: CARRIERS.senmart.name,
        carrierTagline: CARRIERS.senmart.taglineKey,
        available: true,
        totalPrice: own,
        currency: 'USD',
        transitDaysMin: 1,
        transitDaysMax: 2,
        validDays: 7,
        serviceType: 'portToDoor',
        breakdown: q.ftlAddress ? drayageAccessorials(q.ftlAddress) : undefined,
      }
    : { id: `${q.id}-senmart`, carrier: 'senmart', carrierName: CARRIERS.senmart.name, carrierTagline: CARRIERS.senmart.taglineKey, available: false, currency: 'USD', serviceType: 'portToDoor' }
  // Drayage is SMALL FREIGHT's own service only — other carriers' fields are ignored.
  return { quotationId: q.id, quotationNumber: q.number, rates: [ownRate] }
}

/** Chassis is billed per day with a 2-day minimum (old FCL result page). */
export const CHASSIS_MIN_DAYS = 2

/** Terminal price sheet from /api/ftl-addresses (possible accessorial charges), with the billing unit of each. */
export function drayageAccessorials(a: RawFtlAddress): DrayageFee[] {
  const rows: [string, number, DrayageFeeUnit][] = [
    ['chassis', a.chassis, 'perDay'], ['storage', a.storage, 'perDay'], ['prepull', a.prepull, 'perContainer'],
    ['detention', a.dentention, 'perHourAfter2'], ['residentialDelivery', a.residentialDelivery, 'perContainer'],
    ['owPermit', a.owPermit, 'perContainer'], ['chassisSplit', a.chassisSplit, 'perContainer'], ['reefer', a.reefer, 'perContainer'],
    ['hazmat', a.hazmat, 'perContainer'], ['dryRun', a.dryrun, 'perContainer'], ['layover', a.layover, 'over350Miles'],
    // Pier pass is stored in cents (5900 → $59), as the old result page shows it.
    ['pierPass20', a.pierPass20 / 100, 'perContainer'], ['pierPass40', a.pierPass40 / 100, 'perContainer'],
    ['congestionNyct', a.congestionNyct, 'perContainer'], ['tollFeeToPa', a.tollFeeToPa, 'perContainer'],
  ]
  return rows.filter(([, v]) => v > 0).map(([label, amount, unit]) => ({ label, amount, unit }))
}

/** FTL quotation → SMALL FREIGHT's own drayage quote: base rate + chassis (2-day min) = estimated total. */
export function toDrayageQuote(q: RawQuotation, port: DrayagePort, destination: Location, containers: string[]): DrayageQuote {
  const fees = q.ftlAddress ? drayageAccessorials(q.ftlAddress) : port.fees
  const chassisPerDay = fees.find((f) => f.label === 'chassis')?.amount ?? 0
  const baseRate = q.ftlRate?.baseRate ?? q.ftlPrice ?? undefined
  return {
    quotationId: q.id,
    quotationNumber: q.number,
    port,
    destination,
    containers,
    baseRate,
    chassisPerDay,
    chassisMinDays: CHASSIS_MIN_DAYS,
    estimatedTotal: baseRate === undefined ? undefined : baseRate + chassisPerDay * CHASSIS_MIN_DAYS,
    otherFees: fees,
  }
}

const titleCase = (s: string) => s.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

export function toDrayagePort(a: RawFtlAddress): DrayagePort {
  const city = a.city.trim()
  return {
    id: a.id,
    city: titleCase(city),
    state: a.state,
    zip: a.zip,
    terminal: (a.terminal ?? '').trim() || titleCase(city),
    location: (a.location ?? '').trim(),
    point: TERMINAL_POINTS[city.toUpperCase()],
    fees: drayageAccessorials(a),
  }
}
