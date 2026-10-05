'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import s from './ui.module.css'

function useOverlay(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        // Keep focus inside the dialog.
        const f = panel.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[data-autofocus], input, button')?.focus())
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
  }, [open, onClose])
  return panel
}

interface PanelProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
}

/** Right-side drawer (spec §4 / §15: 180–220ms slide). Full-screen sheet on mobile via width clamp. */
export function Drawer({ open, onClose, title, children, footer, width }: PanelProps) {
  const panel = useOverlay(open, onClose)
  const id = useId()
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <>
      <div className={s.overlay} onClick={onClose} aria-hidden />
      <div ref={panel} className={s.drawer} role="dialog" aria-modal="true" aria-labelledby={id} style={width ? { width: `min(${width}px, calc(100vw / var(--ui-zoom)))` } : undefined}>
        <PanelHead id={id} title={title} onClose={onClose} />
        <div className={s.panelBody}>{children}</div>
        {footer && <div className={s.panelFoot}>{footer}</div>}
      </div>
    </>,
    document.body,
  )
}

export function Modal({ open, onClose, title, children, footer, width }: PanelProps) {
  const panel = useOverlay(open, onClose)
  const id = useId()
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <>
      <div className={s.overlay} onClick={onClose} aria-hidden />
      <div ref={panel} className={s.modal} role="dialog" aria-modal="true" aria-labelledby={id} style={width ? { width: `min(${width}px, calc(100vw / var(--ui-zoom) - 32px))` } : undefined}>
        <PanelHead id={id} title={title} onClose={onClose} />
        <div className={s.panelBody}>{children}</div>
        {footer && <div className={s.panelFoot}>{footer}</div>}
      </div>
    </>,
    document.body,
  )
}

function PanelHead({ id, title, onClose }: { id: string; title: ReactNode; onClose: () => void }) {
  return (
    <div className={s.panelHead}>
      <h2 id={id} className={s.panelTitle}>
        {title}
      </h2>
      <Button variant="ghost" size="sm" iconOnly className={s.panelClose} onClick={onClose} aria-label="Close">
        <X size={18} />
      </Button>
    </div>
  )
}
