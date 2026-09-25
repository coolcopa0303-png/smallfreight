'use client'

import dynamic from 'next/dynamic'
import type { GeoPoint } from '@/domain/types'
import s from '../shipment/shipment.module.css'

export interface MapMarker {
  point: GeoPoint
  kind: 'pinRed' | 'pinBlue' | 'port' | 'dot' | 'ring' | 'vessel'
  label?: string
  labelDirection?: 'right' | 'left' | 'top' | 'bottom'
}

export interface RouteMapProps {
  markers: MapMarker[]
  /** [lat, lng] pairs */
  path?: [number, number][]
  variant?: 'road'
  /** bold: white-cased road route (quotes). thin: light line for ocean routes. */
  routeStyle?: 'bold' | 'thin'
  dashed?: boolean
  ariaLabel: string
  padding?: number
}

/** Lazy, client-only map (spec §16: lazy-load, zoom + fit only, brand-blue route). */
export const RouteMap = dynamic<RouteMapProps>(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className={s.map}>
      <div className={s.mapSkeleton} />
    </div>
  ),
})
