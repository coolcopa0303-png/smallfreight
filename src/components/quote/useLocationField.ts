'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Location } from '@/domain/types'
import { lookupZip } from '@/services/geo'
import { formatLocation } from './quoteUtils'

export type LocationStatus = 'idle' | 'loading' | 'resolved' | 'notFound'

export interface LocationValue {
  text: string
  location?: Location
  status: LocationStatus
}

export interface LocationField extends LocationValue {
  setText: (text: string) => void
  /** Resolve now (blur / Enter / address-book pick). */
  resolve: (text?: string) => void
  clear: () => void
}

const ZIP_RE = /\b(\d{5})(?:-\d{4})?\b/
const CITY_STATE_RE = /^\s*([A-Za-z][A-Za-z .'-]+?)\s*,\s*([A-Za-z]{2})\s*$/

/**
 * "City, ST" → first ZIP of that place via zippopotam.us (the same public provider geo.ts uses for coordinates),
 * then the normal ZIP lookup. TODO(shared): move into services/geo.ts.
 */
async function lookupCityState(city: string, state: string): Promise<Location | undefined> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(state.toLowerCase())}/${encodeURIComponent(city.toLowerCase())}`)
    if (!r.ok) return undefined
    const zip: string | undefined = (await r.json())?.places?.[0]?.['post code']
    return zip ? lookupZip(zip) : undefined
  } catch {
    return undefined
  }
}

export async function resolveLocationText(text: string): Promise<Location | undefined> {
  const zip = text.match(ZIP_RE)?.[1]
  if (zip) return lookupZip(zip)
  const cs = text.match(CITY_STATE_RE)
  return cs ? lookupCityState(cs[1], cs[2]) : undefined
}

const canResolve = (t: string) => ZIP_RE.test(t) || CITY_STATE_RE.test(t)

/**
 * Free-text location ("City, State or ZIP") that resolves to a ZIP-backed Location.
 * `resolver` lets Drayage add its terminal check; `format` controls the text shown once resolved.
 */
export function useLocationField(opts: {
  initial?: string | null
  resolver?: (text: string) => Promise<Location | undefined>
  format?: (l: Location) => string
} = {}): LocationField {
  const { initial, resolver = resolveLocationText, format = formatLocation } = opts
  const [value, setValue] = useState<LocationValue>(() => ({ text: initial ?? '', status: initial && canResolve(initial) ? 'loading' : 'idle' }))
  const seq = useRef(0)
  const cfg = useRef({ resolver, format })
  const current = useRef(value)
  useEffect(() => {
    cfg.current = { resolver, format }
    current.current = value
  })

  const settle = useCallback(async (text: string, id: number) => {
    const loc = await cfg.current.resolver(text).catch(() => undefined)
    if (id !== seq.current) return
    setValue(loc ? { text: cfg.current.format(loc), location: loc, status: 'resolved' } : { text, status: 'notFound' })
  }, [])

  const resolve = useCallback(
    (text?: string) => {
      const v = current.current
      const t = (text ?? v.text).trim()
      if (!t || (text === undefined && (v.status === 'resolved' || v.status === 'loading'))) return
      if (!canResolve(t)) {
        setValue({ text: t, status: 'notFound' })
        return
      }
      setValue({ text: t, status: 'loading' })
      void settle(t, ++seq.current)
    },
    [settle],
  )

  const setText = useCallback(
    (text: string) => {
      seq.current++
      setValue({ text, status: 'idle' })
      // A completed 5-digit ZIP resolves immediately; "City, ST" waits for blur / Enter.
      if (/^\s*\d{5}\s*$/.test(text) || /\b\d{5}\s*$/.test(text)) resolve(text)
    },
    [resolve],
  )

  const clear = useCallback(() => {
    seq.current++
    setValue({ text: '', status: 'idle' })
  }, [])

  // Prefill from the URL (dashboard hand-off).
  useEffect(() => {
    if (initial && canResolve(initial)) void settle(initial, ++seq.current)
  }, [initial, settle])

  return { ...value, setText, resolve, clear }
}
