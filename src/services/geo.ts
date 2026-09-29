// Geocoding + routing for quote maps.
// - City/state from the existing backend (/api/geocode, no coordinates)
// - Coordinates from zippopotam.us (public, CORS-enabled)
// - Road route from the public OSRM demo server; falls back to a straight line when unavailable.
// Swap these providers here if the company adopts a commercial map API.
import type { GeoPoint, Location, RouteInfo } from '@/domain/types'
import { apiGet } from '@/lib/api/client'

const pointCache = new Map<string, Promise<GeoPoint | undefined>>()

export function zipToPoint(zip: string): Promise<GeoPoint | undefined> {
  if (!pointCache.has(zip)) {
    pointCache.set(
      zip,
      fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const p = j?.places?.[0]
          return p ? { lat: Number(p.latitude), lng: Number(p.longitude) } : undefined
        })
        .catch(() => undefined),
    )
  }
  return pointCache.get(zip)!
}

/** ZIP → city/state via the existing backend, plus coordinates for the map. */
export async function lookupZip(zip: string): Promise<Location | undefined> {
  if (!/^\d{5}$/.test(zip)) return undefined
  const [place, point] = await Promise.all([
    apiGet<{ city: string; state: string } | null>(`/api/geocode?zip=${zip}`).catch(() => null),
    zipToPoint(zip),
  ])
  if (!place) return undefined
  return { zip, city: place.city, state: place.state, country: 'US', point }
}

export function haversineMiles(a: GeoPoint, b: GeoPoint) {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const h =
    Math.sin(toRad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export async function roadRoute(a: GeoPoint, b: GeoPoint): Promise<RouteInfo> {
  try {
    const r = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=simplified&geometries=geojson`,
    )
    const j = await r.json()
    const route = j.routes?.[0]
    if (!route) throw new Error('no route')
    return {
      miles: Math.round(route.distance / 1609.344),
      path: (route.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
      approximate: false,
    }
  } catch {
    return { miles: Math.round(haversineMiles(a, b) * 1.18), path: [[a.lat, a.lng], [b.lat, b.lng]], approximate: true }
  }
}

export const TERMINAL_POINTS: Record<string, GeoPoint> = {
  MIAMI: { lat: 25.7743, lng: -80.1703 },
  CINCINNATI: { lat: 39.1025, lng: -84.5431 },
  CHICAGO: { lat: 41.4239, lng: -88.1737 },
  DALLAS: { lat: 32.9707, lng: -97.2958 },
  TAMPA: { lat: 27.9364, lng: -82.4344 },
  MEMPHIS: { lat: 35.0907, lng: -89.9993 },
  CHARLESTON: { lat: 32.8994, lng: -79.9148 },
  SAVANNAH: { lat: 32.1286, lng: -81.1406 },
  ATLANTA: { lat: 33.7066, lng: -84.4278 },
  'NEW YORK': { lat: 40.6769, lng: -74.1448 },
  'LOS ANGELES': { lat: 33.7361, lng: -118.2656 },
  'SALT LAKE CITY': { lat: 40.7607, lng: -111.9721 },
  'KANSAS CITY': { lat: 39.0839, lng: -94.6282 },
  BALTIMORE: { lat: 39.2555, lng: -76.5577 },
  SEATTLE: { lat: 47.2672, lng: -122.4136 },
  HOUSTON: { lat: 29.6153, lng: -95.0149 },
  OAKLAND: { lat: 37.7958, lng: -122.3136 },
}

/** Known coordinates for ports / ramps used in fixtures and drayage terminals. */
export const PLACE_POINTS: Record<string, GeoPoint> = {
  CNSHA: { lat: 31.35, lng: 121.6 },
  CNNGB: { lat: 29.93, lng: 121.85 },
  CNSZX: { lat: 22.57, lng: 114.27 },
  CNTAO: { lat: 36.08, lng: 120.3 },
  CNXMN: { lat: 24.47, lng: 118.07 },
  KRPUS: { lat: 35.1, lng: 129.04 },
  VNSGN: { lat: 10.76, lng: 106.79 },
  DEHAM: { lat: 53.54, lng: 9.97 },
  USLAX: { lat: 33.74, lng: -118.27 },
  USLGB: { lat: 33.75, lng: -118.21 },
  USNYC: { lat: 40.68, lng: -74.15 },
  USSAV: { lat: 32.13, lng: -81.14 },
  USHOU: { lat: 29.61, lng: -95.01 },
  USCHI: { lat: 41.42, lng: -88.17 },
  USSEA: { lat: 47.27, lng: -122.41 },
  USOAK: { lat: 37.8, lng: -122.31 },
}
