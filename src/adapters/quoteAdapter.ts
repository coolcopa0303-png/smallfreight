import type { RawFtlAddress, RawQuotation, RawVendorQuote } from '@/domain/raw'
import type { CarrierCode, DrayagePort, QuoteResult, RateOption } from '@/domain/types'
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
  const others = (['saia', 'arcb', 'xpo', 'estes', 'uber'] as CarrierCode[])
    .map((k) => vendorRate(q, k, q[k], 'portToDoor'))
    .filter((r) => r.available)
    .map((r) => ({ ...r, validDays: r.validDays ?? 7 }))
  return { quotationId: q.id, quotationNumber: q.number, rates: [...others, ownRate] }
}

/** Terminal price sheet from /api/ftl-addresses (possible accessorial charges). */
export function drayageAccessorials(a: RawFtlAddress) {
  const rows: [string, number][] = [
    ['chassis', a.chassis], ['storage', a.storage], ['prepull', a.prepull], ['detention', a.dentention],
    ['residentialDelivery', a.residentialDelivery], ['owPermit', a.owPermit], ['chassisSplit', a.chassisSplit],
    ['reefer', a.reefer], ['hazmat', a.hazmat], ['dryRun', a.dryrun], ['layover', a.layover],
    ['pierPass20', a.pierPass20], ['pierPass40', a.pierPass40], ['congestionNyct', a.congestionNyct], ['tollFeeToPa', a.tollFeeToPa],
  ]
  return rows.filter(([, v]) => v > 0).map(([label, amount]) => ({ label, amount }))
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
