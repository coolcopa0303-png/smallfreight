'use client'

import { CircleCheck } from 'lucide-react'
import { STATUS_META } from '@/domain/statusMap'
import type { ShipmentStatus } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import s from './dashChip.module.css'

/**
 * Dashboard-only status chip using the dashboard's 4-colour palette (dashboard.module.css --dash-*).
 * The rest of the portal keeps the calm blue/gray StatusChip.
 */
export function DashStatusChip({ status, completed }: { status: ShipmentStatus; completed?: boolean }) {
  const { t } = useI18n()
  const label = completed ? t('status.completed') : t(STATUS_META[status].labelKey)
  return (
    <span className={s.chip} data-status={status}>
      {status === 'delivered' ? <CircleCheck size={13} strokeWidth={2.4} aria-hidden /> : <span className={s.ring} aria-hidden />}
      {label}
    </span>
  )
}
