'use client'

import { ArrowRight, MoveRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { PlaceLabel } from '@/components/shipment/PlaceLabel'
import { ShipmentProgress } from '@/components/shipment/ShipmentProgress'
import { Skeleton } from '@/components/ui/States'
import { StatusChip } from '@/components/ui/StatusChip'
import { STATUS_META } from '@/domain/statusMap'
import type { Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { AlertBadge, EtaCell, LastUpdateCell, ModeBadge, ShipmentIds } from './RowParts'
import s from './tracking.module.css'

/** Compact horizontal shipment card (reference 02). Whole row opens the detail; "View Details" is the keyboard entry. */
export function ShipmentRow({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  const router = useRouter()
  const href = `/shipments/${sh.id}`
  const status = sh.completed ? t('status.completed') : t(STATUS_META[sh.status].labelKey)

  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a, button, [tabindex]')) return
    if (window.getSelection()?.toString()) return // let people select/copy text
    router.push(href)
  }

  return (
    <li className={s.row} onClick={onClick}>
      <div className={s.cShip}>
        <ShipmentIds sh={sh} />
      </div>
      <div className={s.cMode}>
        <ModeBadge sh={sh} />
      </div>
      <div className={s.cRoute}>
        <PlaceLabel place={sh.origin} />
        <MoveRight size={16} className={s.routeArrow} aria-label={t('shipments.tracking.to')} />
        <PlaceLabel place={sh.destination} />
      </div>
      <div className={s.cProgress}>
        {/* Calm list: reached steps stay brand blue for delivered rows too (no all-green rows). */}
        <ShipmentProgress milestones={sh.milestones} delivered={false} />
      </div>
      <div className={s.cStatus}>
        <StatusChip status={sh.status} completed={sh.completed} />
        <AlertBadge alerts={sh.alerts} />
      </div>
      <div className={s.cEta}>
        <EtaCell sh={sh} />
      </div>
      <div className={s.cUpdate}>
        <LastUpdateCell sh={sh} />
      </div>
      <div className={s.cAction}>
        <Link href={href} className={s.view} aria-label={t('shipments.tracking.rowLabel', { id: sh.smNumber, status })}>
          <span className={s.viewText}>{t('common.actions.viewDetails')}</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </li>
  )
}

export function ShipmentRowSkeleton() {
  return (
    <li className={s.row} aria-hidden>
      <div className={s.cShip}>
        <Skeleton width={80} height={14} />
        <Skeleton width={100} height={10} style={{ marginTop: 6 }} />
        <Skeleton width={70} height={10} style={{ marginTop: 5 }} />
      </div>
      <div className={s.cMode}>
        <Skeleton width={40} height={24} />
      </div>
      <div className={s.cRoute}>
        <Skeleton width="80%" height={14} />
      </div>
      <div className={s.cProgress}>
        <Skeleton height={14} />
      </div>
      <div className={s.cStatus}>
        <Skeleton width={96} height={26} radius={13} />
      </div>
      <div className={s.cEta}>
        <Skeleton width={80} height={12} />
      </div>
      <div className={s.cUpdate}>
        <Skeleton width={80} height={12} />
      </div>
      <div className={s.cAction}>
        <Skeleton width={80} height={12} />
      </div>
    </li>
  )
}
