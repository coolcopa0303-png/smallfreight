'use client'

import useSWR from 'swr'
import type { GeoPoint } from '@/domain/types'
import { roadRoute } from '@/services/geo'

/** Road route between two points (OSRM, straight-line fallback flagged `approximate`). */
export function useRoute(a?: GeoPoint, b?: GeoPoint) {
  const key = a && b ? ['route', a.lat, a.lng, b.lat, b.lng] : null
  const { data, isLoading } = useSWR(key, () => roadRoute(a!, b!), { revalidateOnFocus: false, revalidateIfStale: false })
  return { route: key ? data : undefined, routing: isLoading }
}
