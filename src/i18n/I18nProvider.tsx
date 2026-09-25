'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dictionaries, type Lang } from './dictionaries'

// Same storage key as the old portal so the customer's language choice carries over.
const STORAGE_KEY = 'language'

type Vars = Record<string, string | number | undefined>

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function lookup(dict: unknown, key: string): string | undefined {
  let cur: unknown = dict
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[part]
    else return undefined
  }
  return typeof cur === 'string' ? cur : undefined
}

function interpolate(s: string, vars?: Vars) {
  if (!vars) return s
  return s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] === undefined ? '' : String(vars[k])))
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from storage after hydration
      if (saved === 'zh-CN' || saved === 'en') setLangState(saved)
    } catch {
      // storage unavailable
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // storage unavailable
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const s = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key)
      if (s === undefined) {
        if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`)
        return key
      }
      return interpolate(s, vars)
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
