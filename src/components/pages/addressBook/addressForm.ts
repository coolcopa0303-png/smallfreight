import type { AddressEntry } from '@/domain/types'

export const COUNTRIES = ['US', 'CA', 'MX', 'CN', 'HK', 'TW', 'VN', 'KR', 'JP', 'DE', 'GB'] as const

export type FormValues = {
  company: string
  street: string
  street2: string
  zip: string
  city: string
  state: string
  country: string
  firstName: string
  lastName: string
  phone: string
  phoneExt: string
  email: string
}
export type FormField = keyof FormValues
/** Field → addressBook.errors.* key */
export type FormErrors = Partial<Record<FormField, string>>

export const emptyForm: FormValues = {
  company: '', street: '', street2: '', zip: '', city: '', state: '', country: 'US',
  firstName: '', lastName: '', phone: '', phoneExt: '', email: '',
}

export function toForm(a?: AddressEntry): FormValues {
  if (!a) return { ...emptyForm }
  return {
    company: a.company ?? '', street: a.street ?? '', street2: a.street2 ?? '', zip: a.zip ?? '', city: a.city ?? '',
    state: a.state ?? '', country: a.country || 'US', firstName: a.firstName ?? '', lastName: a.lastName ?? '',
    phone: a.phone ?? '', phoneExt: a.phoneExt ?? '', email: a.email ?? '',
  }
}

const opt = (v: string) => v.trim() || undefined

export function fromForm(v: FormValues): Omit<AddressEntry, 'id'> {
  return {
    company: opt(v.company), street: opt(v.street), street2: opt(v.street2), zip: v.zip.trim(), city: v.city.trim(),
    state: v.state.trim(), country: v.country, firstName: opt(v.firstName), lastName: opt(v.lastName),
    phone: opt(v.phone), phoneExt: opt(v.phoneExt), email: opt(v.email),
  }
}

export function validate(v: FormValues): FormErrors {
  const e: FormErrors = {}
  if (!v.company.trim() && !v.firstName.trim() && !v.lastName.trim()) {
    e.company = 'nameOrCompany'
    e.firstName = 'nameOrCompany'
  }
  if (!v.street.trim()) e.street = 'required'
  if (!v.city.trim()) e.city = 'required'
  if (!v.state.trim()) e.state = 'required'
  if (!v.country) e.country = 'required'
  const zip = v.zip.trim()
  if (!zip) e.zip = 'required'
  else if (v.country === 'US' && !/^\d{5}$/.test(zip)) e.zip = 'zipUs'
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'email'
  if (v.phone.trim()) {
    const digits = v.phone.replace(/\D/g, '')
    if (!/^\+?[\d\s().-]+$/.test(v.phone.trim()) || digits.length < 7 || digits.length > 15) e.phone = 'phone'
  }
  if (v.phoneExt.trim() && !/^\d{1,6}$/.test(v.phoneExt.trim())) e.phoneExt = 'phoneExt'
  return e
}

export const displayName = (a: AddressEntry) => [a.firstName, a.lastName].filter(Boolean).join(' ')

export function matches(a: AddressEntry, q: string) {
  if (!q) return true
  const hay = [a.company, displayName(a), a.city, a.state, a.zip, a.email, a.street].filter(Boolean).join(' ').toLowerCase()
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))
}

export function regionName(code: string, lang: string) {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}
