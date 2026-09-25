'use client'

import { BarChart3, CalendarRange, Layers, PieChart, Ship } from 'lucide-react'
import { useMemo } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useShipments } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { BreakdownBars, SplitBar } from './BreakdownBars'
import { computeKpis, etaByMonth, serviceRows, splitCounts, statusRows } from './compute'
import { EtaMonthChart } from './EtaMonthChart'
import { KpiTiles } from './KpiTiles'
import s from './analytics.module.css'

function LoadingView() {
  return (
    <div aria-busy="true">
      <div className={s.kpis}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={s.kpi}>
            <Skeleton width={40} height={40} radius={10} />
            <div className={s.kpiBody}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="40%" height={26} style={{ marginTop: 8 }} />
              <Skeleton width="70%" height={11} style={{ marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
      <div className={s.grid}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton width="40%" height={18} />
            <Skeleton height={200} radius={8} style={{ marginTop: 16 }} />
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const { t } = useI18n()
  const { data, isLoading, error, mutate } = useShipments()
  const list = useMemo(() => data ?? [], [data])

  const stats = useMemo(
    () => ({
      kpis: computeKpis(list),
      months: etaByMonth(list),
      status: statusRows(list),
      services: serviceRows(list),
      mode: splitCounts(list, (x) => x.mode, ['FCL', 'LCL']),
      transport: splitCounts(list, (x) => x.transport, ['ocean', 'truck']),
    }),
    [list],
  )

  let body
  if (error && !data) {
    body = (
      <Card>
        <ErrorState title={t('analytics.error')} onRetry={() => void mutate()} />
      </Card>
    )
  } else if (isLoading && !data) {
    body = <LoadingView />
  } else if (list.length === 0) {
    body = (
      <Card>
        <EmptyState icon={<BarChart3 size={22} />} title={t('analytics.empty.title')} body={t('analytics.empty.body')} />
      </Card>
    )
  } else {
    body = (
      <>
        <KpiTiles kpis={stats.kpis} />
        <div className={s.grid}>
          <Card>
            <CardHeader icon={<CalendarRange size={22} />} title={t('analytics.eta.title')} subtitle={t('analytics.eta.subtitle')} />
            <EtaMonthChart buckets={stats.months} />
          </Card>
          <Card>
            <CardHeader icon={<PieChart size={22} />} title={t('analytics.status.title')} subtitle={t('analytics.status.subtitle', { count: list.length })} />
            <BreakdownBars rows={stats.status} total={list.length} label={t('analytics.status.title')} />
          </Card>
          <Card>
            <CardHeader icon={<Layers size={22} />} title={t('analytics.services.title')} subtitle={t('analytics.services.subtitle')} />
            <BreakdownBars rows={stats.services} total={list.length} label={t('analytics.services.title')} />
          </Card>
          <Card>
            <CardHeader icon={<Ship size={22} />} title={t('analytics.mode.title')} subtitle={t('analytics.mode.subtitle')} />
            <div className={s.splits}>
              <SplitBar
                title={t('analytics.mode.loadType')}
                parts={stats.mode.map((m, i) => ({
                  key: m.key,
                  label: t(`analytics.mode.${m.key}`),
                  count: m.count,
                  color: i === 0 ? 'var(--brand-primary)' : 'var(--navy-800)',
                }))}
              />
              <SplitBar
                title={t('analytics.mode.transport')}
                parts={stats.transport.map((m, i) => ({
                  key: m.key,
                  label: t(`common.mode.${m.key}`),
                  count: m.count,
                  color: i === 0 ? 'var(--brand-primary)' : 'var(--navy-800)',
                }))}
              />
            </div>
          </Card>
        </div>
      </>
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>{t('analytics.title')}</h1>
        <p className={s.subtitle}>{t('analytics.subtitle')}</p>
      </header>
      {body}
    </div>
  )
}
