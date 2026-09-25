'use client'

// Leaflet renderer. Never import directly — use <RouteMap> (lazy, ssr:false) from ./RouteMap.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import s from '../shipment/shipment.module.css'
import type { MapMarker, RouteMapProps } from './RouteMap'

const TILES = {
  road: {
    // CARTO basemaps now require an API key; Esri World Street Map is keyless.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
}

const BRAND = '#0B5FF5'
const RED = '#E5484D'

function icon(m: MapMarker) {
  const svg: Record<MapMarker['kind'], string> = {
    pinRed: `<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 39s12-13.2 12-23A12 12 0 0 0 3 16c0 9.8 12 23 12 23Z" fill="${RED}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="16" r="4.5" fill="#fff"/></svg>`,
    pinBlue: `<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 39s12-13.2 12-23A12 12 0 0 0 3 16c0 9.8 12 23 12 23Z" fill="${BRAND}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="16" r="4.5" fill="#fff"/></svg>`,
    port: `<svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="${BRAND}" stroke="#fff" stroke-width="3"/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="11" r="2.2"/><path d="M18 13.5v13M12 19h-2a8 8 0 0 0 16 0h-2M14 17h8"/></g></svg>`,
    ring: `<svg width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="#fff" stroke="${BRAND}" stroke-width="4"/><circle cx="13" cy="13" r="4" fill="#fff"/></svg>`,
    vessel: `<svg width="42" height="22" viewBox="0 0 42 22"><path d="M3 13h36l-5 7H8z" fill="#fff"/><path d="M8 13V9h6v4M15 13V6h6v7M22 13V8h6v5" fill="#e8eef5" stroke="#c7d2e0"/><path d="M29 13V4h4v9" fill="#fff"/><path d="M3 13h36l-5 7H8z" fill="none" stroke="#9fb3cc"/><path d="M1 21h40" stroke="rgba(255,255,255,.6)"/></svg>`,
  }
  const size: Record<MapMarker['kind'], [number, number]> = { pinRed: [30, 40], pinBlue: [30, 40], port: [36, 36], ring: [26, 26], vessel: [42, 22] }
  const [w, h] = size[m.kind]
  const anchor: [number, number] = m.kind.startsWith('pin') ? [w / 2, h - 1] : [w / 2, h / 2]
  return L.divIcon({ html: svg[m.kind], className: '', iconSize: [w, h], iconAnchor: anchor })
}

export default function MapCanvas({ markers, path, variant = 'road', dashed, ariaLabel, padding = 60 }: RouteMapProps) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, worldCopyJump: true })
    L.control.zoom({ position: 'topleft' }).addTo(m)
    L.tileLayer(TILES[variant].url, {
      attribution: TILES[variant].attribution,
      maxZoom: 18,
      // Satellite imagery is darkened toward the design's navy look (see globals.css).
      className: variant === 'satellite' ? 'sf-sat-tiles' : undefined,
    }).addTo(m)
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    m.setView([37, -96], 4)
    return () => {
      m.remove()
      map.current = null
    }
  }, [variant])

  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const pts: L.LatLngExpression[] = []
    if (path && path.length > 1) {
      if (variant === 'road') L.polyline(path, { color: '#ffffff', weight: 8, opacity: 0.9 }).addTo(g)
      L.polyline(path, { color: variant === 'satellite' ? '#ffffff' : BRAND, weight: variant === 'satellite' ? 2.5 : 5, opacity: 0.95, dashArray: dashed ? '6 8' : undefined, lineCap: 'round' }).addTo(g)
      pts.push(...path)
    }
    for (const mk of markers) {
      const marker = L.marker([mk.point.lat, mk.point.lng], { icon: icon(mk), keyboard: false, title: mk.label ?? '' }).addTo(g)
      if (mk.label) {
        marker.bindTooltip(mk.label, {
          permanent: true,
          direction: mk.labelDirection ?? 'right',
          offset: mk.kind.startsWith('pin') ? [14, -22] : [16, 0],
          className: variant === 'satellite' ? 'sf-map-label-dark' : 'sf-map-label',
        })
      }
      pts.push([mk.point.lat, mk.point.lng])
    }
    if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [padding, padding], maxZoom: 11 })
    else if (pts.length === 1) m.setView(pts[0], 9)
  }, [markers, path, variant, dashed, padding])

  return <div ref={el} className={s.map} role="img" aria-label={ariaLabel} />
}
