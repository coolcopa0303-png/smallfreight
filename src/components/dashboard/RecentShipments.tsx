'use client'

import { ArrowRight, ClipboardList, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { tabCounts } from '@/adapters/shipmentAdapter'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardHeader, ViewAllLink } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { matchesTab, type StatusTab } from '@/domain/statusMap'
import type { Place, Shipment } from '@/domain/types'
import { useShipments } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtIsoDate } from '@/i18n/format'
import { DashStatusChip } from './DashStatusChip'
import s from './recent.module.css'

const TABS = ['all', 'inTransit', 'atPort', 'customs', 'delivered'] as const satisfies readonly StatusTab[]
type RecentTab = (typeof TABS)[number]
const ROWS = 5
const COLS = ['booking', 'type', 'origin', 'destination', 'status', 'eta', 'lastUpdate', 'actions'] as const

function PlaceCell({ place }: { place?: Place }) {
  const { t } = useI18n()
  if (!place) return <span className={s.muted}>{t('common.states.none')}</span>
  return (
    <>
      <span className={s.main}>{place.city}</span>
      {place.portCode && <span className={s.sub}>{place.portCode}</span>}
    </>
  )
}

/** Five most recently updated shipments with status tabs (spec §5.4, left). */
export function RecentShipments() {
  const { t } = useI18n()
  const router = useRouter()
  const { data, error, isLoading, mutate } = useShipments()
  const [tab, setTab] = useState<RecentTab>('all')

  const counts = useMemo(() => (data ? tabCounts(data) : undefined), [data])
  const rows = useMemo(() => {
    if (!data) return []
    return data
      .filter((sh) => matchesTab(sh.status, tab))
      .sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''))
      .slice(0, ROWS)
  }, [data, tab])

  const items = TABS.map((k) => ({
    key: k,
    label: counts ? t('dashboard.recent.tab', { label: t(`status.tabs.${k}`), count: counts[k] }) : t(`status.tabs.${k}`),
  }))

  return (
    <Card className={s.card} padded={false}>
      <div className={s.head}>
        <CardHeader
          icon={<ClipboardList size={26} strokeWidth={1.8} />}
          title={t('dashboard.recent.title')}
          action={<ViewAllLink href="/shipments">{t('common.actions.viewAll')}</ViewAllLink>}
        />
        <div className={s.toolbar}>
          <Tabs items={items} value={tab} onChange={setTab} label={t('dashboard.recent.tabsLabel')} className={s.tabs} />
          <ButtonLink href="/shipments" variant="neutral" size="sm" leading={<SlidersHorizontal size={15} />} className={s.more}>
            {t('common.actions.moreFilters')}
          </ButtonLink>
        </div>
      </div>

      {error && !data ? (
        <ErrorState title={t('dashboard.recent.error')} onRetry={() => void mutate()} />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c} scope="col" className={s[`c-${c}`]}>
                    {t(`dashboard.recent.cols.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && !data
                ? Array.from({ length: ROWS }, (_, i) => (
                    <tr key={i} aria-hidden>
                      {COLS.map((c) => (
                        <td key={c} className={s[`c-${c}`]}>
                          <Skeleton width={c === 'actions' ? 40 : '70%'} height={12} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((sh) => <Row key={sh.id} sh={sh} onOpen={() => router.push(`/shipments/${sh.id}`)} />)}
            </tbody>
          </table>
          {data && rows.length === 0 && <EmptyState title={t('dashboard.recent.empty')} body={t('dashboard.recent.emptyHint')} />}
        </div>
      )}
    </Card>
  )
}

function Row({ sh, onOpen }: { sh: Shipment; onOpen: () => void }) {
  const { t } = useI18n()
  return (
    <tr className={s.row} onClick={onOpen}>
      <td className={s['c-booking']}>
        <span className={`${s.id} mono`}>{sh.smNumber}</span>
      </td>
      <td className={s['c-type']}>{sh.mode}</td>
      <td className={s['c-origin']}>
        <PlaceCell place={sh.origin} />
      </td>
      <td className={s['c-destination']}>
        <PlaceCell place={sh.destination} />
      </td>
      <td className={s['c-status']}>
        <DashStatusChip status={sh.status} completed={sh.completed} />
      </td>
      <td className={s['c-eta']}>{fmtIsoDate(sh.eta)}</td>
      <td className={s['c-lastUpdate']}>
        <span className={s.main}>{fmtIsoDate(sh.lastUpdated)}</span>
        {sh.lastEvent && <span className={s.sub} title={sh.lastEvent}>{sh.lastEvent}</span>}
      </td>
      <td className={s['c-actions']}>
        <Link href={`/shipments/${sh.id}`} className={s.view} onClick={(e) => e.stopPropagation()} aria-label={t('dashboard.recent.viewShipment', { id: sh.smNumber })}>
          {t('common.actions.view')}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </td>
    </tr>
  )
}
