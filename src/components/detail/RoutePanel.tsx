'use client'

import { MapPinOff } from 'lucide-react'
import { useMemo } from 'react'
import { RouteMap, type MapMarker } from '@/components/map/RouteMap'
import type { Place, Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate } from '@/i18n/format'
import { routeGeometry, voyageProgress } from './helpers'
import s from './overview.module.css'

/** Origin → destination summary, plus the light route map below it. */
export function RoutePanel({ shipment: sh }: { shipment: Shipment }) {
  const { t } = useI18n()
  return (
    <section className={s.routeCard} aria-label={t('detail.route.label')}>
      <div className={s.routeSummary}>
        <PlaceBlock place={sh.origin} date={sh.etd} kind="origin" />
        <div className={s.routeArrow} aria-hidden>
          <span className={s.routeLine} />
          <svg width="18" height="18" viewBox="0 0 18 18" className={s.routeHead}>
            <path d="M2 9h13M10 3.5 15.5 9 10 14.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={s.routeLine} />
        </div>
        <PlaceBlock place={sh.destination} date={sh.eta} kind="destination" />
      </div>
      <RouteMapArea shipment={sh} />
    </section>
  )
}

function PlaceBlock({ place, date, kind }: { place?: Place; date?: string; kind: 'origin' | 'destination' }) {
  const { t, lang } = useI18n()
  const dateLabel = t(kind === 'origin' ? 'detail.route.etd' : 'detail.route.eta')
  return (
    <div className={s.place} data-kind={kind}>
      <div className={s.placeText}>
        <span className={s.srOnly}>{t(`detail.route.${kind}`)}: </span>
        <p className={`${s.placeCity} ${place ? '' : s.muted}`}>
          {place ? `${place.city}, ${place.countryCode}` : t(kind === 'origin' ? 'detail.route.unknownOrigin' : 'detail.route.unknownDestination')}
        </p>
        {place?.portName && <p className={s.placePort}>{place.portName}</p>}
        <p className={s.placeDate} title={dateLabel}>
          <span className={s.srOnly}>{dateLabel} </span>
          {fmtDate(date, lang)}
        </p>
      </div>
    </div>
  )
}

// Leaflet renders tooltip strings as HTML — strip markup; the line break is shown via CSS pre-line.
const plain = (v: string) => v.replace(/[<>&]/g, '')
const label = (p: Place) => [p.city, p.portName].filter(Boolean).map((v) => plain(v!)).join('\n')

function RouteMapArea({ shipment: sh }: { shipment: Shipment }) {
  const { t } = useI18n()
  const geo = useMemo(() => routeGeometry(sh), [sh])
  const markers = useMemo<MapMarker[]>(() => {
    if (!geo || !sh.origin || !sh.destination) return []
    const list: MapMarker[] = [
      { point: { lat: geo.from[0], lng: geo.from[1] }, kind: 'dot', label: label(sh.origin), labelDirection: 'bottom' },
      { point: { lat: geo.to[0], lng: geo.to[1] }, kind: 'dot', label: label(sh.destination), labelDirection: 'bottom' },
    ]
    const progress = sh.status === 'inTransit' ? voyageProgress(sh.etd, sh.eta) : undefined
    if (progress !== undefined) {
      // Keep the vessel visibly on the line rather than hidden under a port ring or its label.
      const [lat, lng] = geo.at(Math.min(0.75, Math.max(0.3, progress)))
      list.push({ point: { lat, lng }, kind: 'vessel' })
    }
    return list
  }, [geo, sh])

  if (!geo || !sh.origin || !sh.destination) {
    return (
      <div className={s.noMap} role="status">
        <MapPinOff size={22} aria-hidden />
        <div>
          <p className={s.noMapTitle}>{t('detail.route.noMapTitle')}</p>
          <p className={s.noMapBody}>{t('detail.route.noMap')}</p>
        </div>
      </div>
    )
  }
  return (
    <div className={s.mapBox}>
      <RouteMap
        markers={markers}
        path={geo.path}
        variant="road"
        routeStyle="thin"
        dashed
        padding={64}
        ariaLabel={t('detail.route.mapLabel', { from: sh.origin.city, to: sh.destination.city })}
      />
    </div>
  )
}
