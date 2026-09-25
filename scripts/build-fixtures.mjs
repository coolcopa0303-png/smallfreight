// Builds anonymized mock fixtures from ../capture (real API responses captured from the old site).
// Usage: node scripts/build-fixtures.mjs
// Output: src/mocks/data/*.json — no real customer identifiers (MBL / container / ref / ISF / addresses / emails).
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const capture = path.resolve(root, '../capture')
const out = path.join(root, 'src/mocks/data')
fs.mkdirSync(out, { recursive: true })

// HTS tariff items sample (public data)
fs.writeFileSync(path.join(out, 'hts-items.json'), fs.readFileSync(path.join(capture, 'hts_items_sample.json'), 'utf8'))

// Deterministic PRNG so fixtures are stable between runs.
let seed = 20260924
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const digits = (n) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join('')
const letters = (n) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPRSTUVWXYZ'[Math.floor(rand() * 23)]).join('')

const cargoes = JSON.parse(fs.readFileSync(path.join(capture, 'cargoes_all.json'), 'utf8'))

// Proposed backend fields (pol / pod / etd / parties / cargo) — the live API does not return them yet.
const ORIGINS = [
  { city: 'Shanghai', country: 'CN', code: 'CNSHA', port: 'Port of Shanghai' },
  { city: 'Ningbo', country: 'CN', code: 'CNNGB', port: 'Port of Ningbo-Zhoushan' },
  { city: 'Shenzhen', country: 'CN', code: 'CNSZX', port: 'Port of Yantian' },
  { city: 'Qingdao', country: 'CN', code: 'CNTAO', port: 'Port of Qingdao' },
  { city: 'Xiamen', country: 'CN', code: 'CNXMN', port: 'Port of Xiamen' },
  { city: 'Busan', country: 'KR', code: 'KRPUS', port: 'Port of Busan' },
  { city: 'Ho Chi Minh', country: 'VN', code: 'VNSGN', port: 'Cat Lai Terminal' },
  { city: 'Hamburg', country: 'DE', code: 'DEHAM', port: 'Port of Hamburg' },
]
const DESTS = [
  { city: 'Los Angeles', country: 'US', code: 'USLAX', port: 'Port of Los Angeles' },
  { city: 'Long Beach', country: 'US', code: 'USLGB', port: 'Port of Long Beach' },
  { city: 'New York', country: 'US', code: 'USNYC', port: 'Port of New York & New Jersey' },
  { city: 'Savannah', country: 'US', code: 'USSAV', port: 'Garden City Terminal' },
  { city: 'Houston', country: 'US', code: 'USHOU', port: 'Port of Houston' },
  { city: 'Chicago', country: 'US', code: 'USCHI', port: 'Joliet Rail Ramp' },
  { city: 'Seattle', country: 'US', code: 'USSEA', port: 'Port of Seattle' },
  { city: 'Oakland', country: 'US', code: 'USOAK', port: 'Port of Oakland' },
]
const COMMODITIES = [
  ['Electronics and accessories', '8471.30.0100'], ['Plastic household articles', '3924.90.5650'],
  ['Furniture parts', '9403.90.8041'], ['Cotton apparel', '6204.62.4011'], ['Network cables', '8544.42.9090'],
  ['Pet supplies', '4201.00.6000'], ['LED lighting fixtures', '9405.42.8410'], ['Auto parts', '8708.99.8180'],
]
const SHIPPERS = ['Eastwind Trading Co., Ltd.', 'Harbor Light Manufacturing Ltd.', 'Golden Bridge Industrial Co.', 'Bluewave Export Co., Ltd.']
const CONSIGNEES = ['Northstar Imports Inc.', 'Summit Retail Group LLC', 'Cedar Supply Co.', 'Brightline Distribution Inc.']
const ADDRESSES = ['1200 Commerce Way, Ontario, CA 91761', '455 Industrial Blvd, Edison, NJ 08837', '88 Logistics Pkwy, Savannah, GA 31407', '7020 Freight Dr, Houston, TX 77032']

const containerMap = new Map()
const anonContainer = (c) => {
  if (!c) return c
  if (!containerMap.has(c)) containerMap.set(c, c.slice(0, 4) + digits(7))
  return containerMap.get(c)
}
const scrubText = (s) => {
  let r = s
  for (const [real, fake] of containerMap) if (real) r = r.split(real).join(fake)
  return r
}

const DAY = 86400000
const mock = cargoes.map((c, i) => {
  const containers = c.containers.map(anonContainer)
  const containerDates = Object.fromEntries(Object.entries(c.containerDates || {}).map(([k, v]) => [anonContainer(k), v]))
  const origin = pick(ORIGINS)
  const dest = pick(DESTS)
  const transitDays = 14 + Math.floor(rand() * 20)
  const etd = c.eta ? new Date(new Date(c.eta).getTime() - transitDays * DAY).toISOString().slice(0, 10) : null
  const [commodity, hs] = pick(COMMODITIES)
  const packages = 20 + Math.floor(rand() * 400)
  return {
    ...c,
    id: 300000 + i,
    displayId: 'SM' + (241800 + i),
    mbl: c.mbl ? c.mbl.slice(0, 4) + letters(2) + digits(8) : c.mbl,
    hbl: c.hbl ? 'SMFH' + digits(8) : c.hbl,
    containers,
    containerDates,
    ref: c.ref ? 'PO-' + digits(5) : c.ref,
    isf: c.isf ? 'NYS-' + digits(11) : c.isf,
    deliverTo: c.deliverTo ? pick(ADDRESSES) : c.deliverTo,
    updates: scrubText(c.updates || ''),
    statusItems: c.statusItems.map((s) => ({ ...s, content: scrubText(s.content) })),
    // ---- proposed fields (not in live API) ----
    pol: origin,
    pod: dest,
    etd,
    shipper: pick(SHIPPERS),
    consignee: pick(CONSIGNEES),
    cargo: {
      description: commodity,
      hsCode: hs,
      packages: `${packages} cartons`,
      weightKg: Math.round(packages * (20 + rand() * 60)),
      volumeCbm: Math.round(packages * (0.05 + rand() * 0.2) * 10) / 10,
      containerType: pick(["40' High Cube", "40' Standard", "20' Standard"]),
      sealNumber: 'SMT' + digits(7),
      dangerousGoods: false,
    },
  }
})
// ---- Demo variety (fake data only) ----
// The captured account is almost all customs-brokerage files, so several statuses never occur.
// Reshape a handful of shipments so every status / alert / timeline state is visible in the demo.
const TODAY = new Date()
const day = (offset) => new Date(TODAY.getTime() + offset * DAY).toISOString().slice(0, 10)
const at = (offset) => new Date(TODAY.getTime() + offset * DAY).toISOString()
const events = (list) => list.map(([content, offset]) => ({ content, time: at(offset) })).reverse()
const withTrucking = (c) => ({ ...c, types: [...new Set([...c.types, 20, 30])] })
const containerAt = (c, dates) => ({ [c.containers[0]]: { lfd: null, pickupDate: null, deliverDate: null, emptyReturnDate: null, emptyNotificationDate: null, ...dates } })
const reshape = {
  // At Port — released, waiting for pickup; LFD soon / today / passed drive the alerts.
  atPort: (c, i) => {
    const eta = -3 - i
    return withTrucking({
      ...c, eta: day(eta), etd: day(eta - 24), customReleased: true, isfStatus: true,
      deliverTo: pick(ADDRESSES),
      containerDates: containerAt(c, { lfd: day([2, 1, 0, -1, 4, 6][i % 6]) }),
      statusItems: events([['CASE OPEN', eta - 30], ['ISF FINISHED', eta - 28], ['ENTRY DATA ENTERED', eta - 5], ['7501 SENT', eta - 4], [`${c.containers[0]} ARRIVED AT PORT`, eta], ['CUSTOM RELEASED', eta + 1], ['PENDING Appt', eta + 2]]),
    })
  },
  outForDelivery: (c, i) => {
    const eta = -6 - i
    return withTrucking({
      ...c, eta: day(eta), etd: day(eta - 26), customReleased: true, isfStatus: true, deliverTo: pick(ADDRESSES),
      containerDates: containerAt(c, { lfd: day(eta + 5), pickupDate: day(0) }),
      statusItems: events([['CASE OPEN', eta - 32], ['ISF FINISHED', eta - 30], ['ENTRY DATA ENTERED', eta - 4], ['CUSTOM RELEASED', eta + 1], [`SHIPMENT ${c.containers[0]} PICKED UP`, -0.2], ['PENDING DELIVERY', -0.1]]),
    })
  },
  deliveredTruck: (c, i) => {
    const eta = -12 - i * 3
    return withTrucking({
      ...c, eta: day(eta), etd: day(eta - 25), customReleased: true, isfStatus: true, deliverTo: pick(ADDRESSES),
      containerDates: containerAt(c, { lfd: day(eta + 5), pickupDate: day(eta + 3), deliverDate: day(eta + 4), emptyReturnDate: day(eta + 8) }),
      statusItems: events([['CASE OPEN', eta - 30], ['ISF FINISHED', eta - 29], ['CUSTOM RELEASED', eta + 1], [`SHIPMENT ${c.containers[0]} PICKED UP`, eta + 3], [`${c.containers[0]} DELIVERED`, eta + 4], [`${c.containers[0]} EMPTY RETURN`, eta + 8]]),
    })
  },
  // Pending — case opened, nothing filed yet.
  pending: (c, i) => ({
    ...c, eta: day(20 + i * 4), etd: null, isfStatus: null, customReleased: null, isf: '',
    statusItems: events([['CASE OPEN', -1 - i]]),
  }),
  exception: (c) => ({ ...c, isUrgent: true }),
}
const plan = [['atPort', 6], ['outForDelivery', 3], ['deliveredTruck', 3], ['pending', 4]]
// Take candidates from the most recent (top) of the list, skipping the first few in-transit rows.
let cursor = 8
for (const [kind, n] of plan) {
  for (let i = 0; i < n; i++, cursor += 3) mock[cursor] = reshape[kind](mock[cursor], i)
}
// Exceptions on two in-transit shipments near the top of the list.
mock[2] = reshape.exception(mock[2])
mock[5] = reshape.exception(mock[5])
mock.forEach((c) => { c.updates = c.statusItems.map((s) => `${s.time.slice(0, 10).replace(/-/g, '/')} ${s.content}`).reverse().join('\n') + '\n' })

fs.writeFileSync(path.join(out, 'cargoes.json'), JSON.stringify(mock))

// /api/me — anonymized user.
fs.writeFileSync(path.join(out, 'me.json'), JSON.stringify({
  user: { id: 'demo-user', email: 'demo@smallfreight.example', role: 'Guest', scopes: ['service:address'], smallCustomerId: 1, accessFclQuote: true, accessLtlQuote: true },
  billTos: [{ id: 'demo-billto', smallBillingId: 1, userId: 'demo-user', expiredAt: null, createdAt: '2026-01-01T00:00:00.000Z', periodDays: 180 }],
  userConfig: { cargoTable: { columns: ['displayId', 'mbl', 'hbl', 'container', 'ref', 'eta', 'isfStatus', 'pgaStatus', 'customReleased', 'freightReleased', 'statusSteps'].map((id) => ({ id, visible: true })) } },
}))

// FTL (drayage) terminals — public terminal addresses + price sheet.
const ftl = JSON.parse(fs.readFileSync(path.join(capture, 'ftl_addresses.json'), 'utf8'))
fs.writeFileSync(path.join(out, 'ftl-addresses.json'), JSON.stringify(ftl.map((a) => ({ ...a, city: a.city.trim() }))))

// HTS inquiries — strip customer identities, keep product / answer content.
const [inqList, inqCount] = JSON.parse(fs.readFileSync(path.join(capture, 'hts_inquiries.json'), 'utf8'))
const staff = new Map()
const anonStaff = (n) => { if (!n) return n; if (!staff.has(n)) staff.set(n, 'Broker ' + String.fromCharCode(65 + staff.size)); return staff.get(n) }
fs.writeFileSync(path.join(out, 'hts-inquiries.json'), JSON.stringify([
  inqList.map((q) => ({ ...q, userDisplayName: q.userDisplayName ? 'customer@example.com' : null, externalUserId: null, answerBy: anonStaff(q.answerBy) })),
  inqCount,
]))

// HTS items + inquiry detail samples from the API log (public tariff data).
const log = [
  ...JSON.parse(fs.readFileSync(path.join(capture, 'api_log.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(capture, 'api_log2.json'), 'utf8')),
]
const details = {}
for (const e of log) {
  const m = e.url.match(/\/api\/hts-inquiries\/(\d+)$/)
  if (m && e.body) {
    try {
      const d = JSON.parse(e.body).data
      details[m[1]] = { ...d, userDisplayName: d.userDisplayName ? 'customer@example.com' : null, externalUserId: null, answerBy: anonStaff(d.answerBy) }
    } catch { /* truncated body */ }
  }
}
fs.writeFileSync(path.join(out, 'hts-inquiry-details.json'), JSON.stringify(details))

console.log('cargoes', mock.length, 'ftl', ftl.length, 'inquiries', inqList.length, 'details', Object.keys(details).length)
