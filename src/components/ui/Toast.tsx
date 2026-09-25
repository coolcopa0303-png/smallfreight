'use client'

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import s from './ui.module.css'

type Kind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: Kind
  message: ReactNode
}

const ToastContext = createContext<((message: ReactNode, kind?: Kind) => void) | null>(null)

/** Copy / save / quote selected / API errors (spec §4.7). Auto-dismiss after ~3.5s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (message: ReactNode, kind: Kind = 'success') => {
      const id = ++seq.current
      setItems((l) => [...l.slice(-3), { id, kind, message }])
      setTimeout(() => dismiss(id), kind === 'error' ? 5000 : 3500)
    },
    [dismiss],
  )
  const value = useMemo(() => push, [push])
  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info }
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={s.toaster} aria-live="polite" aria-atomic="false">
        {items.map((it) => {
          const I = Icon[it.kind]
          return (
            <div key={it.id} className={`${s.toast} ${s[`toast-${it.kind}`]}`} role={it.kind === 'error' ? 'alert' : 'status'}>
              <span className={s.toastIcon}>
                <I size={18} />
              </span>
              <span>{it.message}</span>
              <button type="button" className={s.toastClose} onClick={() => dismiss(it.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
