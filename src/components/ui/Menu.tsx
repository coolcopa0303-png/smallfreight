'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import s from './ui.module.css'

/** Click-to-open dropdown menu with outside-click / Escape close. */
export function Menu({ trigger, children, align = 'right', label, width }: {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu'; 'aria-controls': string }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  label: string
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus())
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className={s.menuWrap} ref={ref}>
      {trigger({ onClick: () => setOpen((o) => !o), 'aria-expanded': open, 'aria-haspopup': 'menu', 'aria-controls': id })}
      {open && (
        <div id={id} role="menu" aria-label={label} className={[s.menu, align === 'left' && s.menuLeft].filter(Boolean).join(' ')} style={width ? { width } : undefined}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ children, onSelect, checked, multi, icon }: {
  children: ReactNode
  onSelect: () => void
  checked?: boolean
  /** Multi-select menus (e.g. column toggles) use menuitemcheckbox instead of menuitemradio. */
  multi?: boolean
  icon?: ReactNode
}) {
  const role = checked === undefined ? 'menuitem' : multi ? 'menuitemcheckbox' : 'menuitemradio'
  return (
    <button type="button" role={role} aria-checked={checked} className={s.menuItem} onClick={onSelect}>
      {icon}
      {children}
    </button>
  )
}

export const MenuSeparator = () => <div className={s.menuSep} role="separator" />
