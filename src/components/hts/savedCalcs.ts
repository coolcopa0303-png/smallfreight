'use client'

// Saved duty calculations ("Save to My Inquiries"). The old backend has no endpoint for this,
// so they live in this browser's localStorage (key `sf-saved-hts`) and are listed in My Inquiries.
import { useSyncExternalStore } from 'react'
import type { TransportMode } from '@/services/dutyCalculator'

export interface SavedCalc {
  id: string
  savedAt: string
  htsCode: string
  description: string
  value: number
  origin: string
  mode: TransportMode
  entryDate?: string
  ladingDate?: string
  dutyRatePct?: number
  totalDuties?: number
  landedCost?: number
  /** Labels of the additional duties the user selected. */
  additional: string[]
  exclusions: string[]
}

const KEY = 'sf-saved-hts'
const listeners = new Set<() => void>()
const EMPTY: SavedCalc[] = []
let cache: SavedCalc[] | null = null

function read(): SavedCalc[] {
  if (cache) return cache
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    cache = Array.isArray(parsed) ? parsed : []
  } catch {
    cache = []
  }
  return cache!
}

function write(next: SavedCalc[]) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable — keep in memory for this session
  }
  listeners.forEach((l) => l())
}

export function useSavedCalcs() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) {
          cache = null
          cb()
        }
      }
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(cb)
        window.removeEventListener('storage', onStorage)
      }
    },
    read,
    () => EMPTY,
  )
  return {
    list,
    add: (c: Omit<SavedCalc, 'id' | 'savedAt'>) =>
      write([{ ...c, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString() }, ...read()].slice(0, 100)),
    remove: (id: string) => write(read().filter((c) => c.id !== id)),
  }
}
