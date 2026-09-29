'use client'

import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Copyable } from '@/components/ui/misc'
import { ToneChip } from '@/components/ui/StatusChip'
import type { ReleaseState, Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate } from '@/i18n/format'
import { containerSummary, DASH, serviceType } from './helpers'
import s from './info.module.css'

export function InfoCard({ icon, title, children, id }: { icon: ReactNode; title: string; children: ReactNode; id: string }) {
  return (
    <section className={s.card} aria-labelledby={id}>
      <h2 id={id} className={s.title}>
        <span className={s.icon} aria-hidden>
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value, copy, mono }: { label: string; value?: ReactNode; copy?: string; mono?: boolean }) {
  const empty = value === undefined || value === null || value === ''
  return (
    <div className={s.row}>
      <dt className={s.label}>{label}</dt>
      <dd className={`${s.value} ${mono ? s.mono : ''} ${empty ? s.muted : ''}`}>
        {empty ? DASH : copy ? <Copyable value={copy}>{value}</Copyable> : value}
      </dd>
    </div>
  )
}

const RELEASE_TONE = { released: 'green', notReleased: 'orange', na: 'gray' } as const
const ISF_TONE = { matched: 'green', notMatched: 'orange', na: 'gray' } as const

/** Fields of the old booking drawer: MBL, HBL, CNTR, REF#, ETA, ISF / PGA / customs / freight status, service type. */
export function ShipmentDetailsCard({ shipment: sh }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  const containers = containerSummary(sh)
  const release = (r: ReleaseState) => <ToneChip tone={RELEASE_TONE[r]} size="sm">{t(`status.release.${r}`)}</ToneChip>
  return (
    <InfoCard id="detail-info-shipment" icon={<FileText size={20} />} title={t('detail.details.title')}>
      <div className={s.cols}>
        <dl className={s.list}>
          <Row label={t('detail.details.bl')} value={sh.mbl} copy={sh.mbl} mono />
          <Row label={t('detail.details.hbl')} value={sh.hbl} copy={sh.hbl} mono />
          <Row label={t('detail.details.containers')} value={containers} copy={sh.containers.join(' ') || undefined} mono />
          <Row label={t('detail.details.reference')} value={sh.reference} copy={sh.reference} />
          <Row label={t('detail.details.eta')} value={sh.eta ? fmtDate(sh.eta, lang) : undefined} />
          <Row label={t('detail.details.serviceType')} value={serviceType(sh, t)} />
        </dl>
        <dl className={s.list}>
          <Row
            label={t('detail.details.isfStatus')}
            value={<ToneChip tone={ISF_TONE[sh.isf.state]} size="sm">{t(`status.isf.${sh.isf.state}`)}</ToneChip>}
          />
          <Row label={t('detail.details.pgaStatus')} value={sh.pgaStatus} />
          <Row label={t('detail.details.customsRelease')} value={release(sh.customsRelease)} />
          <Row label={t('detail.details.freightRelease')} value={release(sh.freightRelease)} />
          <Row label={t('detail.details.appointment')} value={sh.appointment} />
          <Row label={t('detail.details.deliverTo')} value={sh.deliverTo} />
        </dl>
      </div>
    </InfoCard>
  )
}
