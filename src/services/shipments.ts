import { toShipment } from '@/adapters/shipmentAdapter'
import type { BillingWindow, RawCargoFile, RawCargoPage, RawCargoQuery } from '@/domain/raw'
import type { Shipment } from '@/domain/types'
import { apiDownload, apiGet, apiPost, DATA_MODE } from '@/lib/api/client'

const PAGE_SIZE = 99 // backend maximum for rowsPerPage

function baseQuery(windows: BillingWindow[]): RawCargoQuery {
  return { billingIdsAndTimeStart: windows, status: [], types: [], page: 0, rowsPerPage: PAGE_SIZE, order: 'desc', orderBy: 'eta' }
}

/**
 * Loads every shipment in the customer's billing windows (≈259 today) so dashboards, tabs and
 * counts can be computed client-side. Rendering is still paginated by the pages themselves.
 */
export async function fetchAllShipments(windows: BillingWindow[]): Promise<Shipment[]> {
  const first = await apiPost<RawCargoPage>('/api/booking/cargoes', baseQuery(windows))
  const pages = Math.ceil(first.count / PAGE_SIZE)
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
      apiPost<RawCargoPage>('/api/booking/cargoes', { ...baseQuery(windows), page: i + 1 }),
    ),
  )
  const now = new Date()
  return [first, ...rest].flatMap((p) => p.cargoes).map((c) => toShipment(c, now))
}

export interface CargoDocument {
  id: string
  name: string
  url?: string
  uploadedAt?: string
}

export async function fetchShipmentFiles(cargoId: string, windows: BillingWindow[]): Promise<CargoDocument[]> {
  const qs = new URLSearchParams({ cargoId, billingIdsAndTimeStart: JSON.stringify(windows) })
  const raw = await apiGet<RawCargoFile[]>(`/api/cargo-files?${qs}`)
  return (raw ?? []).map((f, i) => ({
    id: String(f.id ?? i),
    name: String(f.name ?? f.fileName ?? `Document ${i + 1}`),
    url: typeof f.url === 'string' ? f.url : undefined,
    uploadedAt: typeof f.createdAt === 'string' ? f.createdAt : undefined,
  }))
}

/** Old-portal Excel export in live mode; CSV of the filtered view in mock mode. */
export async function exportShipments(
  windows: BillingWindow[],
  columns: string[],
  lng: string,
  fallbackRows: Shipment[],
): Promise<{ blob: Blob; filename: string }> {
  if (DATA_MODE === 'live') {
    const qs = new URLSearchParams()
    qs.set('billingIdsAndTimeStart', JSON.stringify(windows))
    columns.forEach((c) => qs.append('column', c))
    qs.set('lng', lng)
    const { blob, filename } = await apiDownload(`/api/booking/export?${qs}`)
    return { blob, filename: filename ?? 'shipments.xlsx' }
  }
  const header = ['SM#', 'MBL', 'HBL', 'Container', 'Reference', 'ETA', 'ISF', 'PGA', 'Customs Release', 'Freight Release', 'Status', 'Last Update']
  const rows = fallbackRows.map((s) => [
    s.smNumber, s.mbl ?? '', s.hbl ?? '', s.containers.join(' '), s.reference ?? '', s.eta ?? '', s.isf.state, s.pgaStatus ?? '',
    s.customsRelease, s.freightRelease, s.status, s.lastEvent ?? '',
  ])
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  return { blob: new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), filename: 'shipments.csv' }
}
