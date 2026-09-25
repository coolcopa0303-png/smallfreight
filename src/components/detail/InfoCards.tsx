'use client'

import { Box, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Copyable } from '@/components/ui/misc'
import type { Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
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

export function ShipmentDetailsCard({ shipment: sh }: { shipment: Shipment }) {
  const { t } = useI18n()
  const containers = containerSummary(sh)
  return (
    <InfoCard id="detail-info-shipment" icon={<FileText size={20} />} title={t('detail.details.title')}>
      <dl className={s.list}>
        <Row label={t('detail.details.shipmentNumber')} value={sh.smNumber} copy={sh.smNumber} />
        <Row label={t('detail.details.bookingNumber')} value={sh.smNumber} />
        <Row label={t('detail.details.bl')} value={sh.mbl} copy={sh.mbl} />
        {sh.hbl && <Row label={t('detail.details.hbl')} value={sh.hbl} copy={sh.hbl} />}
        <Row label={t('detail.details.serviceType')} value={serviceType(sh, t)} />
        <Row label={t('detail.details.containers')} value={containers} copy={sh.containers.join(' ') || undefined} />
        <Row label={t('detail.details.reference')} value={sh.reference} copy={sh.reference} />
        <Row label={t('detail.details.isf')} value={sh.isfNumber} copy={sh.isfNumber} />
        <Row label={t('detail.details.shipper')} value={sh.shipper} />
        <Row label={t('detail.details.consignee')} value={sh.consignee} />
        <Row label={t('detail.details.deliverTo')} value={sh.deliverTo} />
      </dl>
    </InfoCard>
  )
}

export function CargoCard({ shipment: sh }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  const c = sh.cargo
  const dg = c?.dangerousGoods === undefined ? undefined : t(c.dangerousGoods ? 'detail.cargo.yes' : 'detail.cargo.no')
  return (
    <InfoCard id="detail-info-cargo" icon={<Box size={20} />} title={t('detail.cargo.title')}>
      <dl className={s.list}>
        <Row label={t('detail.cargo.description')} value={c?.description} />
        <Row label={t('detail.cargo.hsCode')} value={c?.hsCode} />
        <Row label={t('detail.cargo.packages')} value={c?.packages} />
        <Row label={t('detail.cargo.weight')} value={c?.weightKg !== undefined ? t('detail.cargo.kgs', { value: fmtNumber(c.weightKg, lang, 2) }) : undefined} />
        <Row label={t('detail.cargo.volume')} value={c?.volumeCbm !== undefined ? t('detail.cargo.cbm', { value: fmtNumber(c.volumeCbm, lang, 2) }) : undefined} />
        <Row label={t('detail.cargo.containerType')} value={c?.containerType ? `${c.containerType} (${sh.mode})` : undefined} />
        <Row label={t('detail.cargo.seal')} value={c?.sealNumber} />
        <Row label={t('detail.cargo.dangerous')} value={dg} />
      </dl>
    </InfoCard>
  )
}
