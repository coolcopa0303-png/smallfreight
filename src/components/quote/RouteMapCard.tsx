'use client'

import { MapPinned } from 'lucide-react'
import { RouteMap, type MapMarker } from '@/components/map/RouteMap'
import { Card } from '@/components/ui/Card'
import s from './route.module.css'

/** Map card (spec §7.3 / §8.2): road tiles, brand-blue route, hint overlay before locations are known. */
export function RouteMapCard({ markers, path, hint, routing, ariaLabel, className, padding = 70 }: {
  markers: MapMarker[]
  path?: [number, number][]
  hint?: string
  routing?: boolean
  ariaLabel: string
  className?: string
  /** Fit-to-route padding in px; keep it small on short maps or long lanes zoom out to the whole country. */
  padding?: number
}) {
  return (
    <Card padded={false} className={[s.mapCard, className].filter(Boolean).join(' ')}>
      <RouteMap markers={markers} path={path} ariaLabel={ariaLabel} padding={padding} />
      {routing && <span className={s.routing} aria-hidden />}
      {hint && (
        <div className={s.mapHint} role="note">
          <MapPinned size={16} aria-hidden />
          {hint}
        </div>
      )}
    </Card>
  )
}
