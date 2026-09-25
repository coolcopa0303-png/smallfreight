// Raw shapes returned by the existing SMALL FREIGHT backend (captured from the live site).
// Components never import these — adapters convert them into view models (domain/types.ts).

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  errorCode?: string
  errorMessage?: string
}

export interface RawMe {
  user: {
    id: string
    email: string
    role: string
    scopes: string[]
    smallCustomerId: number
    accessFclQuote: boolean
    accessLtlQuote: boolean
  }
  billTos: { id: string; smallBillingId: number; userId: string; expiredAt: string | null; createdAt: string; periodDays: number }[]
  userConfig?: RawUserConfig
}

export interface RawUserConfig {
  cargoTable: { columns: { id: string; visible: boolean }[] }
}

export interface BillingWindow {
  billingId: number
  timeStart: string
}

/** Service type codes used by /api/booking/cargoes `types`. */
export const CARGO_TYPE = {
  Isf: 10,
  CustomEntry: 20,
  Trucking: 30,
  Freight: 35,
  Warehouse: 40,
  ArrivalNotices: 50,
  Other: 99,
} as const

/** Old status filter values for /api/booking/cargoes `status`. */
export const CARGO_STATUS_FILTER = {
  IsfFilling: 'ISF Filling',
  EntryTransmitting: 'Entry Transmitting',
  PendingFreightRelease: 'Pending Freight Release',
  Delivering: 'Delivering',
  Delivered: 'Delivered',
} as const

export interface RawContainerDates {
  lfd?: string | null
  pickupDate?: string | null
  deliverDate?: string | null
  emptyReturnDate?: string | null
  emptyNotificationDate?: string | null
}

/** Proposed fields the backend does not return yet (mock fixtures provide them). */
export interface RawPlace {
  city: string
  country: string
  code?: string
  port?: string
}

export interface RawCargo {
  id: number
  displayId: string
  mbl: string | null
  hbl: string | null
  containers: string[]
  ref: string | null
  eta: string | null
  containerDates: Record<string, RawContainerDates>
  types: number[]
  isf: string | null
  isfStatus: boolean | null
  appointment: string | null
  deliverTo: string | null
  updates: string
  customReleased: boolean | null
  freightReleased: boolean | null
  statusSteps: { key: string; finished: boolean }[]
  statusItems: { content: string; time: string }[]
  pgaStatus: string
  isUrgent: boolean
  // ---- proposed (optional) ----
  pol?: RawPlace
  pod?: RawPlace
  etd?: string | null
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

export interface RawCargoQuery {
  billingIdsAndTimeStart: BillingWindow[]
  search?: string
  start?: string
  end?: string
  status: string[]
  types: number[]
  page: number
  rowsPerPage: number
  order: 'asc' | 'desc'
  orderBy: string
}

export interface RawCargoPage {
  cargoes: RawCargo[]
  count: number
}

export interface RawCargoFile {
  id?: number | string
  name?: string
  fileName?: string
  url?: string
  type?: string
  createdAt?: string
  [key: string]: unknown
}

export interface RawAddress {
  id: string
  company?: string | null
  street?: string | null
  street2?: string | null
  city: string
  state: string
  zip: string
  country: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  phoneExt?: string | null
  email?: string | null
}

export interface RawFtlAddress {
  id: string
  city: string
  state: string
  zip: string
  country: string
  terminal: string | null
  location: string | null
  chassis: number
  storage: number
  prepull: number
  dentention: number
  residentialDelivery: number
  owPermit: number
  chassisSplit: number
  reefer: number
  hazmat: number
  dryrun: number
  layover: number
  pierPass20: number
  pierPass40: number
  congestionNyct: number
  tollFeeToPa: number
}

export type RawQuotationType = 'LTL' | 'FTL'

export interface RawLtlShipmentLine {
  weight: string
  units: 'LBS' | 'KGS'
  description?: string
  length: string
  width: string
  height: string
  freightUnits: 'IN' | 'FT' | 'CM' | 'M'
  handlingType: string
  quantity: number
}

export interface RawFtlShipmentLine {
  weight: string
  units: 'LBS' | 'KGS'
  class: '20' | '40' | '45'
  description?: string
}

export interface RawQuotationRequest {
  type: RawQuotationType
  paymentTerms: 'Prepaid' | 'Collect'
  shippingDate: string
  originCity: string
  originState: string
  originZip: string
  originCountry: string
  direction?: 'IMPORT' | 'EXPORT'
  destinationCity: string
  destinationState: string
  destinationZip: string
  destinationCountry: string
  excessiveLengthFeet: number | null
  excessiveLengthInch: number | null
  excessiveTotalInch: number | null
  coverageAmount: number | null
  coverageType: string | null
  limitedAccessPickUpType: string | null
  limitedAccessDeliveryType: string | null
  tradeShowDeliveryType: string | null
  sortPieces: number | null
  accessorials: string[]
  shipments: RawLtlShipmentLine[]
  otherAccessorial: string | null
  ftlAddressId: string | null
  ftlShipments: RawFtlShipmentLine[] | null
}

export interface RawVendorQuote {
  totalInvoice: number
  carrierName?: string
  estimatedDeliveryDate?: string
  expirationDate?: string
  quoteNumber?: string | number
}

export interface RawQuotation extends RawQuotationRequest {
  id: string
  number: string
  ftlPrice: number | null
  visible: boolean
  createdAt: string
  saia: RawVendorQuote | null
  arcb: RawVendorQuote | null
  xpo: RawVendorQuote | null
  estes: RawVendorQuote | null
  senmart: RawVendorQuote | null
  uber: RawVendorQuote | null
  ftlAddress: RawFtlAddress | null
  ftlRate: { baseRate: number } | null
}

export interface RawHtsItem {
  htsCode: string
  duty: string
  description: string
  descriptionChinese: string
  additionalDuty: string
  classification: string
  addCvd: string
  pga: string
  updatedAt: string
}

export interface RawHtsInquiry {
  id: number
  productName: string
  productNameChinese: string
  material: string
  description: string
  userDisplayName: string | null
  externalUserId: string | null
  answerBy: string | null
  createdAt: string
  answer?: { htsCode?: string; duty?: string; description?: string; [k: string]: unknown } | string | null
  aiAnswer?: { htsCode: string; duty: string; description: string } | null
}
