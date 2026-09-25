'use client'

import { useMemo, useSyncExternalStore } from 'react'
import useSWR from 'swr'
import type { Shipment } from '@/domain/types'
import { billingWindows, getMe } from '@/services/auth'
import { fetchAllShipments } from '@/services/shipments'

export function useMe() {
  return useSWR('me', getMe, { revalidateOnFocus: false, shouldRetryOnError: false })
}

export function useBillingWindows() {
  const { data: me } = useMe()
  return useMemo(() => (me ? billingWindows(me) : undefined), [me])
}

export function useShipments() {
  const windows = useBillingWindows()
  const swr = useSWR(windows ? ['shipments', JSON.stringify(windows)] : null, () => fetchAllShipments(windows!), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  return { ...swr, isLoading: swr.isLoading || !windows }
}

export function useShipment(id: string): { shipment?: Shipment; isLoading: boolean; error?: unknown; mutate: () => void } {
  const { data, isLoading, error, mutate } = useShipments()
  const shipment = useMemo(() => data?.find((s) => s.id === id || s.smNumber === id), [data, id])
  return { shipment, isLoading, error, mutate: () => void mutate() }
}

// ---------- tracked shipments ("Track Updates") — per-browser watchlist ----------
const WATCH_KEY = 'sf-watchlist'
const listeners = new Set<() => void>()
let watchCache: string[] | null = null

function readWatch(): string[] {
  if (watchCache) return watchCache
  try {
    watchCache = JSON.parse(localStorage.getItem(WATCH_KEY) ?? '[]')
  } catch {
    watchCache = []
  }
  return watchCache!
}
const EMPTY: string[] = []

export function useWatchlist() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    readWatch,
    () => EMPTY,
  )
  const toggle = (id: string) => {
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    watchCache = next
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(next))
    } catch {
      // storage unavailable — watchlist lives for this session only
    }
    listeners.forEach((l) => l())
  }
  return { list, isWatched: (id: string) => list.includes(id), toggle }
}
