import type { RawAddress } from '@/domain/raw'
import type { AddressEntry } from '@/domain/types'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client'

const toEntry = (a: RawAddress): AddressEntry => ({
  id: a.id,
  company: a.company ?? undefined,
  street: a.street ?? undefined,
  street2: a.street2 ?? undefined,
  city: a.city,
  state: a.state,
  zip: a.zip,
  country: a.country,
  firstName: a.firstName ?? undefined,
  lastName: a.lastName ?? undefined,
  phone: a.phone ?? undefined,
  phoneExt: a.phoneExt ?? undefined,
  email: a.email ?? undefined,
})

const toRaw = (a: Omit<AddressEntry, 'id'>) => ({
  company: a.company ?? '', street: a.street ?? '', street2: a.street2 ?? '', city: a.city, state: a.state, zip: a.zip,
  country: a.country, firstName: a.firstName ?? '', lastName: a.lastName ?? '', phone: a.phone ?? '', phoneExt: a.phoneExt ?? '', email: a.email ?? '',
})

export const fetchAddresses = async () => (await apiGet<RawAddress[]>('/api/addresses')).map(toEntry)
export const createAddress = (a: Omit<AddressEntry, 'id'>) => apiPost<RawAddress>('/api/addresses', toRaw(a))
export const updateAddress = (a: AddressEntry) => apiPut<unknown>(`/api/addresses/${a.id}`, { id: a.id, ...toRaw(a) })
export const deleteAddress = (id: string) => apiDelete<unknown>(`/api/addresses/${id}`)
