'use client'

import { History } from 'lucide-react'
import { EmptyState } from '@/components/ui/States'
import type { Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtTime } from '@/i18n/format'
import { hasTime } from './helpers'
import { InfoCard } from './InfoCards'
import s from './cards.module.css'

/** Status update log, newest first (old drawer's "UPDATE" column). */
export function UpdatesCard({ shipment: sh }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  return (
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
  )
}
