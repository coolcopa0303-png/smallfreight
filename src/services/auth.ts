import type { BillingWindow, RawMe, RawUserConfig } from '@/domain/raw'
import { apiGet, apiPost, apiPut } from '@/lib/api/client'

export const getMe = () => apiGet<RawMe>('/api/me')
export const login = (email: string, password: string) => apiPost<unknown>('/api/auth/login', { email, password })
export const logout = () => apiPost<unknown>('/api/auth/logout')
export const updatePassword = (body: { oldPassword: string; newPassword: string }) => apiPut<unknown>('/api/users/password', body)
export const getUserConfig = () => apiGet<RawUserConfig>('/api/user-config')
export const saveUserConfig = (cfg: RawUserConfig) => apiPut<RawUserConfig>('/api/user-config', cfg)

/** Same derivation as the old portal: each bill-to looks back `periodDays` from today. */
export function billingWindows(me: RawMe | undefined, now: Date = new Date()): BillingWindow[] {
  return (me?.billTos ?? []).map((b) => ({
    billingId: b.smallBillingId,
    timeStart: new Date(now.getTime() - b.periodDays * 86400000).toISOString().slice(0, 10),
  }))
}

export function initials(email?: string) {
  if (!email) return '?'
  const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim().split(/\s+/)
  return ((name[0]?.[0] ?? '') + (name[1]?.[0] ?? name[0]?.[1] ?? '')).toUpperCase() || '?'
}
