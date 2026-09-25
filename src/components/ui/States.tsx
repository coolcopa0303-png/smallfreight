'use client'

import { AlertTriangle, SearchX } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { Button } from './Button'
import s from './ui.module.css'

export function Skeleton({ width = '100%', height = 14, radius, style, className }: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
  className?: string
}) {
  return <span aria-hidden className={[s.skeleton, className].filter(Boolean).join(' ')} style={{ width, height, borderRadius: radius, ...style }} />
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className={s.state} role="status">
      <span className={s.stateIcon} aria-hidden>{icon ?? <SearchX size={22} />}</span>
      <p className={s.stateTitle}>{title}</p>
      {body && <p className={s.stateBody}>{body}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title, onRetry, detail }: { title: ReactNode; onRetry?: () => void; detail?: string }) {
  const { t } = useI18n()
  return (
    <div className={s.state} role="alert">
      <span className={`${s.stateIcon} ${s.stateIconError}`} aria-hidden>
        <AlertTriangle size={22} />
      </span>
      <p className={s.stateTitle}>{title}</p>
      {detail && <p className={s.stateBody}>{detail}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.actions.tryAgain')}
        </Button>
      )}
    </div>
  )
}
