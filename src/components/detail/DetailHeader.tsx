'use client'

import { Fragment, type ReactNode } from 'react'
import { Copyable } from '@/components/ui/misc'
import { StatusChip } from '@/components/ui/StatusChip'
import type { Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { DetailActions } from './DetailActions'
import { containerSummary } from './helpers'
import s from './detail.module.css'

export function DetailHeader({ shipment }: { shipment: Shipment }) {
  const { t } = useI18n()
  const summary = containerSummary(shipment)
  const meta: ReactNode[] = [<span key="mode">{shipment.mode}</span>]
  meta.push(
    <span key="bk" className={s.metaItem}>
      {t('detail.meta.booking')}: <Copyable value={shipment.smNumber} className={s.metaValue} />
    </span>,
  )
  if (shipment.mbl)
    meta.push(
      <span key="bl" className={s.metaItem}>
        {t('detail.meta.bl')}: <Copyable value={shipment.mbl} className={s.metaValue} />
      </span>,
    )
  if (summary)
    meta.push(
      <span key="cn" className={s.metaItem}>
        {shipment.cargo?.containerType ? summary : <Copyable value={shipment.containers.join(' ')} className={s.metaValue}>{summary}</Copyable>}
      </span>,
    )
  if (shipment.reference)
    meta.push(
      <span key="ref" className={s.metaItem}>
        {t('detail.meta.reference')}: <Copyable value={shipment.reference} className={s.metaValue} />
      </span>,
    )

  return (
    <header className={s.header}>
      <div className={s.headMain}>
        <div className={s.titleRow}>
          <h1 className={s.title}>{shipment.smNumber}</h1>
          <StatusChip status={shipment.status} completed={shipment.completed} />
        </div>
        <p className={s.meta} aria-label={t('detail.meta.label')}>
          {meta.map((m, i) => (
            <Fragment key={i}>
              {i > 0 && <span className={s.metaSep} aria-hidden />}
              {m}
            </Fragment>
          ))}
        </p>
      </div>
      <DetailActions shipment={shipment} />
    </header>
  )
}
