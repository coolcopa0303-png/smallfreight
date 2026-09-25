// In-browser mock of the SMALL FREIGHT backend. Mirrors the real endpoint contracts
// (see docs/IMPLEMENTATION_PLAN.md §2) using anonymized fixtures from scripts/build-fixtures.mjs.
import type {
  ApiEnvelope,
  RawAddress,
  RawCargo,
  RawCargoQuery,
  RawFtlAddress,
  RawHtsInquiry,
  RawHtsItem,
  RawMe,
  RawQuotation,
  RawQuotationRequest,
  RawUserConfig,
  RawVendorQuote,
} from '@/domain/raw'
import cargoes from './data/cargoes.json'
import ftlAddresses from './data/ftl-addresses.json'
import htsInquiries from './data/hts-inquiries.json'
import htsInquiryDetails from './data/hts-inquiry-details.json'
import htsItems from './data/hts-items.json'
import me from './data/me.json'
import { haversineMiles, TERMINAL_POINTS } from '@/services/geo'

const CARGOES = cargoes as unknown as RawCargo[]
const FTL = ftlAddresses as unknown as RawFtlAddress[]
const HTS_ITEMS = htsItems as unknown as RawHtsItem[]
const [INQ_LIST, INQ_COUNT] = htsInquiries as unknown as [RawHtsInquiry[], number]
const INQ_DETAILS = htsInquiryDetails as unknown as Record<string, RawHtsInquiry>

// ---------- persisted mock state (per browser) ----------
const STORE_KEY = 'sf-mock-state-v1'
interface MockState {
  addresses: RawAddress[]
  quotations: RawQuotation[]
  inquiries: RawHtsInquiry[]
  userConfig: RawUserConfig
}
function load(): MockState {
  const fallback: MockState = { addresses: [], quotations: [], inquiries: [], userConfig: (me as RawMe).userConfig! }
  try {
    const s = localStorage.getItem(STORE_KEY)
    return s ? { ...fallback, ...JSON.parse(s) } : fallback
  } catch {
    return fallback
  }
}
function save(s: MockState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s))
  } catch {
    // storage unavailable — state lives for this page only
  }
}

const ok = <T>(data?: T): ApiEnvelope<T> => ({ success: true, data })
const fail = (errorCode: string, errorMessage: string): ApiEnvelope<never> => ({ success: false, errorCode, errorMessage })
const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()))

// ---------- geo helpers for mock pricing ----------
async function zipPoint(zip: string): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`)
    if (!r.ok) return null
    const j = await r.json()
    const p = j.places?.[0]
    return p ? { lat: +p.latitude, lng: +p.longitude, city: p['place name'], state: p['state abbreviation'] } : null
  } catch {
    return null
  }
}
const miles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => haversineMiles(a, b) * 1.18 // road factor
const addDays = (iso: string, d: number) => new Date(Date.parse(iso) + d * 86400000).toISOString().slice(0, 10)
const round2 = (n: number) => Math.round(n * 100) / 100

async function createQuotation(req: RawQuotationRequest): Promise<RawQuotation> {
  const dest = await zipPoint(req.destinationZip)
  let dist = 500
  let ftlAddress: RawFtlAddress | null = null
  if (req.type === 'FTL') {
    ftlAddress = FTL.find((a) => a.id === req.ftlAddressId) ?? null
    const o = ftlAddress ? TERMINAL_POINTS[ftlAddress.city.toUpperCase()] : undefined
    if (o && dest) dist = miles(o, dest)
    else dist = 40
  } else {
    const orig = await zipPoint(req.originZip)
    if (orig && dest) dist = miles(orig, dest)
  }

  const vendor = (factor: number, dMin: number, name: string, prefix: string, expDays?: number): RawVendorQuote => {
    let price: number
    if (req.type === 'FTL') {
      price = 290 + dist * 2.6 * factor
    } else {
      const w = req.shipments.reduce((s, l) => s + (l.units === 'KGS' ? +l.weight * 2.2046 : +l.weight) * (l.quantity || 1), 0) || 1000
      price = (180 + dist * 0.14 * Math.pow(w / 1000, 0.8)) * factor
    }
    return {
      totalInvoice: round2(price),
      carrierName: name,
      estimatedDeliveryDate: addDays(req.shippingDate, dMin),
      expirationDate: expDays ? addDays(req.shippingDate, expDays) : undefined,
      quoteNumber: prefix + Math.floor(100000 + Math.random() * 899999),
    }
  }
  const transit = req.type === 'FTL' ? (dist > 120 ? 2 : 1) : Math.ceil(dist / 450) + 1
  const quotation: RawQuotation = {
    ...req,
    id: uid(),
    number: 'Q' + Date.now().toString().slice(-8),
    visible: true,
    createdAt: new Date().toISOString(),
    saia: vendor(1.0, transit + 1, 'SAIA LTL Freight', 'SA', 7),
    arcb: vendor(1.062, transit + 1, 'ABF Freight', 'AB', 7),
    xpo: vendor(1.103, transit + 2, 'XPO Logistics', 'XP', 7),
    estes: vendor(1.133, transit + 2, 'Estes Express Lines', 'ES'),
    uber: vendor(1.187, transit + 2, 'Uber Freight', 'UF', 7),
    // SMALL FREIGHT's own lane: priced for short hauls only in this mock.
    senmart: req.type === 'LTL' ? vendor(1.227, transit + 3, 'SMALL FREIGHT', 'SF', 14) : null,
    ftlPrice: req.type === 'FTL' && dist <= 60 && ftlAddress ? round2(250 + dist * 4.2) : null,
    ftlAddress,
    ftlRate: req.type === 'FTL' && dist <= 60 ? { baseRate: round2(250 + dist * 4.2) } : null,
  }
  return quotation
}

function filterCargoes(q: RawCargoQuery) {
  const STATUS_TEST: Record<string, (c: RawCargo) => boolean> = {
    'ISF Filling': (c) => c.isfStatus !== true,
    'Entry Transmitting': (c) => c.customReleased !== true,
    'Pending Freight Release': (c) => c.customReleased === true && c.freightReleased !== true,
    Delivering: (c) => c.statusItems.some((s) => /PICKED UP|PENDING DELIVERY/i.test(s.content)),
    Delivered: (c) => c.statusItems.some((s) => /DELIVERED|EMPTY RETURN/i.test(s.content)),
  }
  const search = (q.search ?? '').trim().toUpperCase()
  let rows = CARGOES.filter((c) => {
    if (search) {
      const pool = [c.displayId, c.mbl, c.hbl, c.ref, c.isf, ...c.containers].filter(Boolean).map((s) => s!.toUpperCase())
      if (!pool.some((s) => s.includes(search))) return false
    }
    if (q.start && (!c.eta || c.eta < q.start)) return false
    if (q.end && (!c.eta || c.eta > q.end)) return false
    if (q.types.length && !q.types.some((t) => c.types.includes(t))) return false
    if (q.status.length && !q.status.some((s) => STATUS_TEST[s]?.(c))) return false
    return true
  })
  const key = q.orderBy as keyof RawCargo
  rows = [...rows].sort((a, b) => {
    const av = String(a[key] ?? '')
    const bv = String(b[key] ?? '')
    return q.order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })
  const start = q.page * q.rowsPerPage
  return { cargoes: rows.slice(start, start + q.rowsPerPage), count: rows.length }
}

function searchHts(keyword: string) {
  const k = keyword.trim().toLowerCase()
  if (!k) return HTS_ITEMS.slice(0, 20)
  const digits = k.replace(/[^0-9]/g, '')
  const isCode = /^[0-9.\s]+$/.test(k)
  return HTS_ITEMS.filter((i) =>
    isCode ? i.htsCode.replace(/\./g, '').startsWith(digits) : i.description.toLowerCase().includes(k) || i.descriptionChinese?.includes(keyword.trim()),
  ).slice(0, 20)
}

export async function handleMock(method: string, fullPath: string, body?: unknown): Promise<ApiEnvelope<unknown>> {
  const url = new URL(fullPath, 'http://mock.local')
  const p = url.pathname
  const qs = url.searchParams
  const state = load()

  // --- auth / user ---
  if (p === '/api/me') return ok({ ...(me as RawMe), userConfig: state.userConfig })
  if (p === '/api/auth/login') return ok({})
  if (p === '/api/auth/logout') return ok({})
  if (p === '/api/users/password' && method === 'PUT') {
    const b = body as { oldPassword?: string; newPassword?: string }
    if (!b?.newPassword || b.newPassword.length < 6) return fail('badRequest', 'Password must be at least 6 characters')
    return ok({})
  }
  if (p === '/api/user-config') {
    if (method === 'PUT') {
      state.userConfig = body as RawUserConfig
      save(state)
    }
    return ok(state.userConfig)
  }

  // --- booking ---
  if (p === '/api/booking/cargoes') return ok(filterCargoes(body as RawCargoQuery))
  if (p === '/api/cargo-files') {
    // Demo documents (names only) derived from the shipment's milestones.
    const c = CARGOES.find((x) => String(x.id) === qs.get('cargoId'))
    if (!c) return ok([])
    const has = (re: RegExp) => c.statusItems.find((s) => re.test(s.content.toUpperCase()))
    const docs = [
      [/ISF FINISHED/, 'ISF Filing Confirmation.pdf'],
      [/CASE OPEN/, 'Commercial Invoice & Packing List.pdf'],
      [/7501|ENTRY DATA/, 'CBP Form 7501 - Entry Summary.pdf'],
      [/CUSTOM RELEASED/, 'Customs Release Notice.pdf'],
      [/DELIVERED/, 'Proof of Delivery.pdf'],
    ] as const
    return ok(docs.flatMap(([re, name], i) => { const hit = has(re); return hit ? [{ id: `${c.id}-${i}`, name, createdAt: hit.time }] : [] }))
  }

  // --- quotations ---
  if (p === '/api/quotations-browser' && method === 'POST') {
    const q = await createQuotation(body as RawQuotationRequest)
    state.quotations.unshift(q)
    save(state)
    return ok(q)
  }
  if (p === '/api/quotations-browser' && method === 'GET') {
    const type = qs.get('type')
    const kw = (qs.get('keyword') ?? '').toLowerCase()
    const list = state.quotations.filter(
      (q) => q.visible && (!type || q.type === type) && (!kw || JSON.stringify(q).toLowerCase().includes(kw)),
    )
    return ok(list.slice(0, Number(qs.get('limit') ?? 100)))
  }
  if (p === '/api/quotations-browser/summary') {
    const type = qs.get('type')
    return ok(
      state.quotations
        .filter((q) => q.visible && (!type || q.type === type))
        .map(({ id, number, type, shippingDate, originCity, originCountry, originState, originZip, destinationCity, destinationCountry, destinationState, destinationZip }) => ({
          id, number, type, shippingDate, originCity, originCountry, originState, originZip, destinationCity, destinationCountry, destinationState, destinationZip,
        })),
    )
  }
  const qm = p.match(/^\/api\/quotations-browser\/([^/]+)(\/visible)?$/)
  if (qm) {
    const q = state.quotations.find((x) => x.id === qm[1])
    if (!q) return fail('notFound', 'Quotation not found')
    if (qm[2] && method === 'PUT') {
      q.visible = !q.visible
      save(state)
    }
    return ok(q)
  }

  // --- geo / drayage ---
  if (p === '/api/geocode') {
    const pt = await zipPoint(qs.get('zip') ?? '')
    return pt ? ok({ city: pt.city, state: pt.state }) : ok(null)
  }
  if (p === '/api/ftl-addresses') return ok(FTL)
  if (p === '/api/ftl-addresses/destination') return ok(undefined)

  // --- addresses ---
  if (p === '/api/addresses' && method === 'GET') return ok(state.addresses)
  if (p === '/api/addresses' && method === 'POST') {
    const a = { ...(body as RawAddress), id: uid() }
    state.addresses.push(a)
    save(state)
    return ok(a)
  }
  const am = p.match(/^\/api\/addresses\/([^/]+)$/)
  if (am) {
    if (method === 'DELETE') state.addresses = state.addresses.filter((a) => a.id !== am[1])
    if (method === 'PUT') state.addresses = state.addresses.map((a) => (a.id === am[1] ? { ...(body as RawAddress), id: am[1] } : a))
    save(state)
    return ok({})
  }

  // --- HTS ---
  if (p === '/api/hts-items') return ok(searchHts(qs.get('keyword') ?? ''))
  if (p === '/api/hts-inquiries' && method === 'GET') {
    const kw = (qs.get('keyword') ?? '').toLowerCase()
    const mine = qs.get('myOnly') === 'true'
    const all = [...state.inquiries, ...INQ_LIST]
    const list = all.filter(
      (q) =>
        (!mine || state.inquiries.includes(q)) &&
        (!kw || [q.productName, q.productNameChinese, q.description, q.material].some((s) => s?.toLowerCase().includes(kw))),
    )
    return ok([list, mine ? state.inquiries.length : INQ_COUNT + state.inquiries.length])
  }
  if (p === '/api/hts-inquiries' && method === 'POST') {
    const b = body as Partial<RawHtsInquiry>
    const q: RawHtsInquiry = {
      id: Date.now(),
      productName: b.productName ?? '',
      productNameChinese: b.productNameChinese ?? '',
      material: b.material ?? '',
      description: b.description ?? '',
      userDisplayName: 'demo@smallfreight.example',
      externalUserId: null,
      answerBy: null,
      createdAt: new Date().toISOString(),
      answer: null,
      aiAnswer: null,
    }
    state.inquiries.unshift(q)
    save(state)
    return ok(q)
  }
  const im = p.match(/^\/api\/hts-inquiries\/(\d+)$/)
  if (im) {
    const d = INQ_DETAILS[im[1]] ?? state.inquiries.find((q) => String(q.id) === im[1]) ?? INQ_LIST.find((q) => String(q.id) === im[1])
    return d ? ok(d) : fail('notFound', 'Inquiry not found')
  }

  return fail('notFound', `Mock endpoint not implemented: ${method} ${p}`)
}
