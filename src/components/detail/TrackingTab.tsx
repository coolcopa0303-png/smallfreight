'use client'

import { History, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { ToneChip } from '@/components/ui/StatusChip'
import { EmptyState } from '@/components/ui/States'
import type { ReleaseState, Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtTime } from '@/i18n/format'
import { DASH, hasTime } from './helpers'
import { InfoCard } from './InfoCards'
import s from './tabs.module.css'

const RELEASE_TONE = { released: 'green', notReleased: 'orange', na: 'gray' } as const
const ISF_TONE = { matched: 'green', notMatched: 'orange', na: 'gray' } as const

export function TrackingTab({ shipment: sh }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  const release = (r: ReleaseState) => <ToneChip tone={RELEASE_TONE[r]} size="sm">{t(`status.release.${r}`)}</ToneChip>
  const grid: [string, ReactNode][] = [
    [t('detail.tracking.isf'), <ToneChip key="isf" tone={ISF_TONE[sh.isf.state]} size="sm">{t(`status.isf.${sh.isf.state}`)}</ToneChip>],
    [t('detail.tracking.pga'), sh.pgaStatus ?? DASH],
    [t('detail.tracking.customsRelease'), release(sh.customsRelease)],
    [t('detail.tracking.freightRelease'), release(sh.freightRelease)],
    [t('detail.tracking.appointment'), sh.appointment ?? DASH],
    [t('detail.tracking.deliverTo'), sh.deliverTo ?? DASH],
  ]

  return (
    <div className={s.trackingGrid}>
      <InfoCard id="detail-events" icon={<History size={20} />} title={t('detail.tracking.eventsTitle')}>
        <p className={s.sub}>{t('detail.tracking.eventsSub')}</p>
        {sh.events.length === 0 ? (
          <EmptyState title={t('detail.tracking.noEvents')} body={t('detail.tracking.noEventsBody')} />
        ) : (
          <ol className={s.events}>
            {sh.events.map((e, i) => (
              <li key={`${e.time}-${i}`} className={s.event} data-first={i === 0 || undefined}>
                <span className={s.eventDot} aria-hidden />
                <div className={s.eventBody}>
                  <p className={s.eventText}>{e.text}</p>
                  <p className={s.eventTime}>
                    <time dateTime={e.time}>
                      {fmtDate(e.time, lang)}
                      {hasTime(e.time) ? ` · ${fmtTime(e.time)}` : ''}
                    </time>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </InfoCard>
      <InfoCard id="detail-clearance" icon={<ShieldCheck size={20} />} title={t('detail.tracking.statusTitle')}>
        <dl className={s.statusGrid}>
          {grid.map(([label, value]) => (
            <div key={label} className={s.statusCell}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </InfoCard>
    </div>
  )
}
