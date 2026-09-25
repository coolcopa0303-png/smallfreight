'use client'

import type { ReactNode } from 'react'
import { StatusChip } from '@/components/ui/StatusChip'
import type { ReleaseState, Shipment } from '@/domain/types'
import { fmtIsoDate } from '@/i18n/format'
import { AlertBadge } from './RowParts'
import s from './myShipments.module.css'

/** Column ids match the old portal's user-config / export ids (cargoTable.columns). */
export const COLUMN_IDS = [
  'displayId',
  'mbl',
  'hbl',
  'container',
  'ref',
  'eta',
  'isfStatus',
  'pgaStatus',
  'customReleased',
  'freightReleased',
  'statusSteps',
] as const
export type ColumnId = (typeof COLUMN_IDS)[number]

type T = (key: string, vars?: Record<string, string | number | undefined>) => string

const dash = <span className={s.muted}>—</span>
const mono = (v?: string) => (v ? <span className="mono">{v}</span> : dash)

function Release({ state, t }: { state: ReleaseState; t: T }) {
  return (
    <span className={s.release} data-state={state}>
      {state !== 'na' && <span className={s.releaseDot} aria-hidden />}
      {t(`status.release.${state}`)}
    </span>
  )
}

export const RENDER: Record<ColumnId, (sh: Shipment, t: T) => ReactNode> = {
  displayId: (sh) => <span className={`${s.sm} mono`}>{sh.smNumber}</span>,
  mbl: (sh) => mono(sh.mbl),
  hbl: (sh) => mono(sh.hbl),
  container: (sh, t) =>
    sh.containers.length ? (
      <span className={s.containers} title={sh.containers.join(', ')}>
        <span className="mono">{sh.containers[0]}</span>
        {sh.containers.length > 1 && <span className={s.more}>{t('shipments.my.moreContainers', { count: sh.containers.length - 1 })}</span>}
      </span>
    ) : (
      dash
    ),
  ref: (sh) => mono(sh.reference),
  eta: (sh) => (sh.eta ? <span>{fmtIsoDate(sh.eta)}</span> : dash),
  isfStatus: (sh, t) =>
    sh.isf.state === 'na' ? (
      <span className={s.muted}>{t('status.isf.na')}</span>
    ) : (
      <span className={s.isf} data-state={sh.isf.state}>
        {t(`status.isf.${sh.isf.state}`)}
      </span>
    ),
  pgaStatus: (sh) => (sh.pgaStatus ? <span className={s.pga}>{sh.pgaStatus}</span> : dash),
  customReleased: (sh, t) => <Release state={sh.customsRelease} t={t} />,
  freightReleased: (sh, t) => <Release state={sh.freightRelease} t={t} />,
  statusSteps: (sh) => (
    <span className={s.statusCell}>
      <StatusChip status={sh.status} completed={sh.completed} size="sm" />
      <AlertBadge alerts={sh.alerts} />
    </span>
  ),
}
