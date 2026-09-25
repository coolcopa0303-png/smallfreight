'use client'

import { CircleAlert, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/StatusChip'
import { Copyable } from '@/components/ui/misc'
import type { Shipment, ShipmentAlert } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { daysFromToday, fmtDate, fmtIsoDate, fmtRelative } from '@/i18n/format'
import s from './tracking.module.css'

/** SM# + B/L + Ref, each copyable on hover (spec §6.4). */
export function ShipmentIds({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  const bl = sh.mbl ?? sh.hbl
  return (
    <div className={s.ids}>
      <Copyable value={sh.smNumber} className={s.sm}>
        {sh.smNumber}
      </Copyable>
      {bl && (
        <Copyable value={bl} className={s.idLine}>
          {t('shipments.tracking.bl', { value: bl })}
        </Copyable>
      )}
      {sh.reference && (
        <Copyable value={sh.reference} className={s.idLine}>
          {t('shipments.tracking.ref', { value: sh.reference })}
        </Copyable>
      )}
    </div>
  )
}

export function ModeBadge({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  const truck = sh.transport === 'truck'
  return (
    <div className={s.mode}>
      <Badge tone={truck ? 'gray' : 'blue'}>{truck ? t('shipments.tracking.drayage') : sh.mode}</Badge>
      <span className={s.modeCaption}>{t(`common.mode.${sh.transport}`)}</span>
    </div>
  )
}

export function EtaCell({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  const done = sh.status === 'delivered'
  let sub: string | undefined
  if (done) sub = t('shipments.tracking.completed')
  else {
    const d = daysFromToday(sh.eta)
    if (d === undefined) sub = undefined
    else if (d > 1) sub = t('common.time.inDays', { count: d })
    else if (d === 1) sub = t('common.time.inOneDay')
    else if (d === 0) sub = t('common.time.today')
    else sub = t('shipments.tracking.arrivedAgo', { count: -d })
  }
  return (
    <div className={s.stack}>
      <span className={s.primary}>{sh.eta ? fmtIsoDate(sh.eta) : t('shipments.tracking.noEta')}</span>
      {sub && <span className={s.secondary}>{sub}</span>}
    </div>
  )
}

export function LastUpdateCell({ sh }: { sh: Shipment }) {
  const { lang } = useI18n()
  return (
    <div className={s.stack}>
      <span className={s.primary}>{fmtDate(sh.lastUpdated, lang)}</span>
      {sh.lastUpdated && <span className={s.secondary}>{fmtRelative(sh.lastUpdated, lang)}</span>}
    </div>
  )
}

const DANGER: ShipmentAlert['kind'][] = ['lfdPast', 'urgent']

/** Small warning/danger icon with the alert text as tooltip + accessible label. */
export function AlertBadge({ alerts }: { alerts: ShipmentAlert[] }) {
  const { t, lang } = useI18n()
  if (!alerts.length) return null
  const danger = alerts.some((a) => DANGER.includes(a.kind))
  const text = alerts.map((a) => t(`status.alerts.${a.kind}`, { date: a.date ? fmtDate(a.date, lang) : '' })).join(' · ')
  const Icon = danger ? CircleAlert : TriangleAlert
  return (
    <span className={s.alert} data-level={danger ? 'danger' : 'warning'} title={text} aria-label={`${t('shipments.tracking.alertsLabel')}: ${text}`} role="img" tabIndex={0}>
      <Icon size={17} strokeWidth={2.2} aria-hidden />
    </span>
  )
}
