'use client'

import { CalendarDays } from 'lucide-react'
import { lfdLevel } from '@/adapters/shipmentAdapter'
import { STATUS_META } from '@/domain/statusMap'
import type { LfdLevel, MilestoneKey, Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { daysFromToday, fmtDate, fmtTime } from '@/i18n/format'
import { eventTime, hasTime, modeLabel } from './helpers'
import { InfoCard } from './InfoCards'
import s from './info.module.css'

type State = 'done' | 'current' | 'upcoming'
interface DateRow {
  key: string
  label: string
  date?: string
  state: State
  lfd?: LfdLevel
}

const ISF_RE = /ISF FINISHED|ISF FILED/

export function KeyDatesCard({ shipment: sh }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  const ms = (k: MilestoneKey) => sh.milestones.find((m) => m.key === k)
  const reached = (k: MilestoneKey) => (ms(k)?.state ?? 'upcoming') !== 'upcoming'
  const first = <K extends keyof Shipment['containerInfo'][number]>(k: K) => sh.containerInfo.find((c) => c[k])?.[k] as string | undefined

  const rows: DateRow[] = []
  rows.push({ key: 'booked', label: t('detail.dates.booked'), date: ms('booked')?.date, state: 'done' })
  const isf = eventTime(sh, ISF_RE)
  if (isf) rows.push({ key: 'isf', label: t('detail.dates.isfFiled'), date: isf, state: 'done' })
  const departed = !!sh.etd && (daysFromToday(sh.etd) ?? 1) <= 0
  rows.push({ key: 'etd', label: t(departed ? 'detail.dates.departed' : 'detail.dates.departure'), date: sh.etd, state: departed ? 'done' : 'upcoming' })
  const arrived = reached('atPort')
  rows.push({ key: 'eta', label: t(arrived ? 'detail.dates.arrived' : 'detail.dates.arrival'), date: sh.eta, state: arrived ? 'done' : 'upcoming' })
  const customs = ms('customs')
  rows.push({ key: 'customs', label: t('detail.dates.customsReleased'), date: customs?.date, state: reached('customs') ? 'done' : 'upcoming' })
  const lfd = sh.containerInfo.map((c) => c.lfd).filter(Boolean).sort()[0]
  const pickup = first('pickupDate') ?? ms('outForDelivery')?.date
  if (lfd) rows.push({ key: 'lfd', label: t('detail.dates.lfd'), date: lfd, state: pickup ? 'done' : 'upcoming', lfd: pickup || sh.status === 'delivered' ? undefined : lfdLevel(lfd) })
  if (pickup || lfd) rows.push({ key: 'pickup', label: t('detail.dates.pickup'), date: pickup, state: pickup ? 'done' : 'upcoming' })
  rows.push({ key: 'delivered', label: t('detail.dates.delivered'), date: ms('delivered')?.date, state: reached('delivered') ? 'done' : 'upcoming' })
  const empty = first('emptyReturnDate')
  if (empty) rows.push({ key: 'empty', label: t('detail.dates.emptyReturn'), date: empty, state: 'done' })

  // Current milestone row (blue) sits right after the last completed row.
  if (sh.status !== 'delivered') {
    const cur = sh.milestones.find((m) => m.state === 'current')
    const label = sh.status === 'inTransit' ? `${t(STATUS_META.inTransit.labelKey)} (${modeLabel(sh, t)})` : t(STATUS_META[sh.status].labelKey)
    let at = 0
    rows.forEach((r, i) => {
      if (r.state === 'done') at = i + 1
    })
    rows.splice(at, 0, { key: 'current', label, date: sh.lastUpdated ?? cur?.date, state: 'current' })
  }

  return (
    <InfoCard id="detail-info-dates" icon={<CalendarDays size={20} />} title={t('detail.dates.title')}>
      <ol className={s.dates}>
        {rows.map((r) => (
          <li key={r.key} className={s.dateRow} data-state={r.state} data-lfd={r.lfd}>
            <span className={s.dot} aria-hidden />
            <span className={s.dateLabel}>
              {r.label}
              {r.lfd === 'warning' && <span className={s.lfdTag}>{t('detail.dates.lfdWarning')}</span>}
              {r.lfd === 'danger' && <span className={s.lfdTag}>{t('detail.dates.lfdDanger')}</span>}
            </span>
            <span className={s.dateValue}>
              <span>{fmtDate(r.date, lang)}</span>
              <span className={s.dateTime}>{hasTime(r.date) ? fmtTime(r.date) : ''}</span>
            </span>
          </li>
        ))}
      </ol>
    </InfoCard>
  )
}
