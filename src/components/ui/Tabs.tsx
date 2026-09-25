'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import s from './ui.module.css'

interface TabItem<K extends string> {
  key: K
  label: ReactNode
}

/** Accessible tablist with arrow-key navigation. `variant="pill"` = status filters, `"underline"` = page sections. */
export function Tabs<K extends string>({ items, value, onChange, variant = 'underline', label, className }: {
  items: TabItem<K>[]
  value: K
  onChange: (k: K) => void
  variant?: 'pill' | 'underline'
  label: string
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (i + dir + items.length) % items.length
    refs.current[next]?.focus()
    onChange(items[next].key)
  }
  return (
    <div role="tablist" aria-label={label} className={[variant === 'pill' ? s.pills : s.underline, className].filter(Boolean).join(' ')}>
      {items.map((it, i) => (
        <button
          key={it.key}
          ref={(el) => {
            refs.current[i] = el
          }}
          role="tab"
          type="button"
          aria-selected={value === it.key}
          tabIndex={value === it.key ? 0 : -1}
          className={variant === 'pill' ? s.pill : s.utab}
          onClick={() => onChange(it.key)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
