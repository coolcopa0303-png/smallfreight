'use client'

import { AlertTriangle, Anchor, ArrowRight, CalendarDays, Check, Clock, FileText, Ship, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'
import { STATUS_META } from '@/domain/statusMap'
import type { Shipment, ShipmentStatus } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { daysFromToday, fmtDate, fmtDateTime } from '@/i18n/format'
import s from './overview.module.css'

const ICON: Record<ShipmentStatus, LucideIcon> = {
  pending: Clock,
  inTransit: Ship,
  atPort: Anchor,
  customs: ShieldCheck,
  outForDelivery: Truck,
  delivered: Check,
  exception: AlertTriangle,
}

function subKey(sh: Shipment) {
  if (sh.completed) return 'completed'
  if (sh.status === 'inTransit') return sh.transport === 'truck' ? 'inTransitTruck' : 'inTransitOcean'
  return sh.status
}

export function CurrentStatusCard({ shipment: sh, onViewTracking }: { shipment: Shipment; onViewTracking: () => void }) {
  const { t, lang } = useI18n()
  const Icon = sh.status === 'inTransit' && sh.transport === 'truck' ? Truck : ICON[sh.status]
  // Design: blue for every active state, green once delivered, red only for exceptions.
  const tone = sh.status === 'delivered' ? 'green' : sh.status === 'exception' ? 'red' : 'blue'
  const label = sh.completed ? t('status.completed') : t(STATUS_META[sh.status].labelKey)

  // Arrival = the atPort milestone has been reached (derived in statusMap, not here).
  const arrived = sh.milestones.find((m) => m.key === 'atPort')?.state !== 'upcoming'
  const days = daysFromToday(sh.eta)
  let pill: { text: string; tone: 'green' | 'orange' | 'blue' } | undefined
  if (arrived && sh.eta) pill = { text: t('detail.status.arrived'), tone: 'green' }
  else if (days !== undefined) {
    if (days > 1) pill = { text: t('detail.status.daysRemaining', { count: days }), tone: 'green' }
    else if (days === 1) pill = { text: t('detail.status.dayRemaining'), tone: 'green' }
    else if (days === 0) pill = { text: t('detail.status.arrivingToday'), tone: 'blue' }
    else pill = { text: t('detail.status.overdue', { count: -days }), tone: 'orange' }
  }

  return (
    <section className={s.statusCard} aria-labelledby="detail-status-title">
      <div className={s.statusHead}>
        <h2 id="detail-status-title" className={s.cardTitle}>
          {t('detail.status.title')}
        </h2>
        <button type="button" className={s.linkBtn} onClick={onViewTracking}>
          {t('detail.status.viewTracking')}
          <ArrowRight size={14} aria-hidden />
        </button>
      </div>

      <div className={s.statusHero} data-tone={tone}>
        <span className={s.statusIcon} aria-hidden>
          <Icon size={34} strokeWidth={2} />
        </span>
        <div className={s.statusText}>
          <p className={s.statusLabel}>{label}</p>
          <p className={s.statusSub}>{t(`detail.status.sub.${subKey(sh)}`)}</p>
        </div>
      </div>

      <div className={s.infoBox}>
        <span className={s.infoIcon} aria-hidden>
          <FileText size={18} />
        </span>
        <div className={s.infoText}>
          <p className={s.infoLabel}>{t('detail.status.lastUpdated')}</p>
          <p className={s.infoValue}>{sh.lastUpdated ? fmtDateTime(sh.lastUpdated, lang) : t('detail.status.noUpdates')}</p>
          {sh.lastEvent && <p className={s.infoNote}>{sh.lastEvent}</p>}
        </div>
      </div>

      <div className={`${s.infoBox} ${s.infoBoxPlain}`}>
        <span className={s.infoIcon} aria-hidden>
          <CalendarDays size={18} />
        </span>
        <div className={s.infoText}>
          <p className={s.infoLabel}>{t(arrived ? 'detail.status.arrival' : 'detail.status.estimatedArrival')}</p>
          <p className={s.infoValue}>{fmtDate(sh.eta, lang)}</p>
        </div>
        {pill && (
          <span className={s.pill} data-tone={pill.tone}>
            {pill.text}
          </span>
        )}
      </div>
    </section>
  )
}
