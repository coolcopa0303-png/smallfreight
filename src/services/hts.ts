import { toHtsInquiry, toHtsItem } from '@/adapters/htsAdapter'
import type { RawHtsInquiry, RawHtsItem } from '@/domain/raw'
import type { HtsInquiry, HtsItem } from '@/domain/types'
import { apiGet, apiPost } from '@/lib/api/client'

export async function searchHtsItems(keyword: string): Promise<HtsItem[]> {
  const raw = await apiGet<RawHtsItem[]>(`/api/hts-items?keyword=${encodeURIComponent(keyword)}`)
  return raw.map(toHtsItem)
}

export async function fetchHtsInquiries(opts: { keyword?: string; page?: number; myOnly?: boolean } = {}) {
  const qs = new URLSearchParams()
  if (opts.keyword) qs.set('keyword', opts.keyword)
  if (opts.page) qs.set('page', String(opts.page))
  if (opts.myOnly) qs.set('myOnly', 'true')
  const [list, count] = await apiGet<[RawHtsInquiry[], number]>(`/api/hts-inquiries?${qs}`)
  return { items: list.map((r) => toHtsInquiry(r)), count }
}

export async function fetchHtsInquiry(id: number): Promise<HtsInquiry> {
  return toHtsInquiry(await apiGet<RawHtsInquiry>(`/api/hts-inquiries/${id}`))
}

export interface NewHtsInquiry {
  productName: string
  productNameChinese?: string
  material?: string
  description?: string
}

export async function submitHtsInquiry(body: NewHtsInquiry): Promise<HtsInquiry> {
  return toHtsInquiry(await apiPost<RawHtsInquiry>('/api/hts-inquiries', body))
}
