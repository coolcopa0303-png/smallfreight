'use client'

import { Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { useToast } from './Toast'
import s from './ui.module.css'

/** Value with a hover-revealed copy icon (spec §6.4). */
export function Copyable({ value, children, className }: { value?: string; children?: ReactNode; className?: string }) {
  const { t } = useI18n()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  if (!value) return <span className={className}>{children ?? '—'}</span>
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast(t('common.toast.copySuccess', { value }))
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast(t('common.states.error'), 'error')
    }
  }
  return (
    <span className={[s.copyWrap, className].filter(Boolean).join(' ')}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children ?? value}</span>
      <button type="button" className={s.copyBtn} onClick={copy} data-copied={copied || undefined} aria-label={`${t('common.actions.copy')} ${value}`}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </span>
  )
}

/** SVG flag (flag-icons) — consistent on Windows/Mac, unlike emoji. */
export function Flag({ code, width = 22, title }: { code?: string; width?: number; title?: string }) {
  if (!code) return null
  const c = code.toLowerCase()
  return (
    <span
      role="img"
      aria-label={title ?? code.toUpperCase()}
      className={`${s.flag} fi fi-${c}`}
      style={{ width, height: Math.round(width * 0.75), lineHeight: 1 }}
    />
  )
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const { t } = useI18n()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <nav className={s.pager} aria-label="Pagination">
      <span className="tnum">{t('common.pagination.range', { from, to, total })}</span>
      <span className={s.pagerBtns}>
        <button type="button" className={s.pagerBtn} disabled={page === 0} onClick={() => onPage(page - 1)} aria-label={t('common.actions.previous')}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" className={s.pagerBtn} disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label={t('common.actions.next')}>
          <ChevronRight size={16} />
        </button>
      </span>
    </nav>
  )
}
