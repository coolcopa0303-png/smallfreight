'use client'

import { CircleCheck } from 'lucide-react'
import { STATUS_META, type StatusTone } from '@/domain/statusMap'
import type { ShipmentStatus } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import s from './ui.module.css'

/** Colour + text; never colour alone (spec §17). */
export function StatusChip({ status, completed, size = 'md', variant = 'dot' }: {
  status: ShipmentStatus
  completed?: boolean
  size?: 'sm' | 'md'
  variant?: 'dot' | 'plain'
}) {
  const { t } = useI18n()
  const meta = STATUS_META[status]
  const label = completed ? t('status.completed') : t(meta.labelKey)
  return (
    <span className={[s.chip, size === 'sm' && s.chipSm, s[`tone-${meta.tone}`]].filter(Boolean).join(' ')}>
      {variant === 'dot' &&
        (status === 'delivered' ? <CircleCheck size={14} strokeWidth={2.2} aria-hidden /> : <span className={s.chipRing} aria-hidden />)}
      {label}
    </span>
  )
}

export function ToneChip({ tone, children, size = 'md' }: { tone: StatusTone; children: React.ReactNode; size?: 'sm' | 'md' }) {
  return <span className={[s.chip, size === 'sm' && s.chipSm, s[`tone-${tone}`]].filter(Boolean).join(' ')}>{children}</span>
}

export function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'gray' }) {
  return <span className={[s.badge, tone === 'green' && s.badgeGreen, tone === 'gray' && s.badgeGray].filter(Boolean).join(' ')}>{children}</span>
}
