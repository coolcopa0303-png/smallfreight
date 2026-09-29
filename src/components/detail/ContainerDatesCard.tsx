'use client'

import { Container } from 'lucide-react'
import { lfdLevel } from '@/adapters/shipmentAdapter'
import { Copyable } from '@/components/ui/misc'
import { EmptyState } from '@/components/ui/States'
import type { ContainerInfo, Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate } from '@/i18n/format'
import { InfoCard } from './InfoCards'
import s from './cards.module.css'

const COLS = ['pickupDate', 'deliverDate', 'emptyReturnDate', 'emptyNotificationDate'] as const
const COL_KEY: Record<(typeof COLS)[number], string> = {
  pickupDate: 'pickup',
  deliverDate: 'delivered',
  emptyReturnDate: 'emptyReturn',
  emptyNotificationDate: 'emptyNotification',
}

/** Per-container dates (old drawer's right column: last free day, pick up, delivery, empty return, empty notification). */
export function ContainerDatesCard({ shipment: sh }: { shipment: Shipment }) {
  const { t } = useI18n()
  return (
    <InfoCard id="detail-containers" icon={<Container size={20} />} title={t('detail.containers.title')}>
      {sh.containerInfo.length === 0 ? (
        <EmptyState title={t('detail.containers.empty')} body={t('detail.containers.emptyBody')} />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">{t('detail.containers.number')}</th>
                <th scope="col">{t('detail.containers.lfd')}</th>
                {COLS.map((c) => (
                  <th key={c} scope="col">
                    {t(`detail.containers.${COL_KEY[c]}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sh.containerInfo.map((c) => (
                <ContainerRow key={c.number} c={c} done={sh.status === 'delivered'} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  )
}

function ContainerRow({ c, done }: { c: ContainerInfo; done: boolean }) {
  const { t, lang } = useI18n()
  // LFD colouring only matters while the container is still at the terminal (same rule as the adapter's alerts).
  const level = c.pickupDate || done ? undefined : lfdLevel(c.lfd)
  return (
    <tr>
      <th scope="row" data-label={t('detail.containers.number')}>
        <Copyable value={c.number} className={s.mono} />
      </th>
      <td data-label={t('detail.containers.lfd')}>
        <span className={s.lfd} data-level={level}>
          {fmtDate(c.lfd, lang)}
          {level === 'warning' && <span className={s.lfdTag}>{t('detail.dates.lfdWarning')}</span>}
          {level === 'danger' && <span className={s.lfdTag}>{t('detail.dates.lfdDanger')}</span>}
        </span>
      </td>
      {COLS.map((k) => (
        <td key={k} data-label={t(`detail.containers.${COL_KEY[k]}`)}>
          {fmtDate(c[k], lang)}
        </td>
      ))}
    </tr>
  )
}
