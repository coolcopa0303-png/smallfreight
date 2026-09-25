'use client'

import { ChartColumn } from 'lucide-react'
import { useMemo } from 'react'
import { countByStatus } from '@/adapters/shipmentAdapter'
import { Card, CardHeader, ViewAllLink } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { STATUS_META } from '@/domain/statusMap'
import { useShipments } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import s from './overview.module.css'
import { TONE_COLOR } from './tone'

const R = 57
const STROKE = 20
const C = 2 * Math.PI * R
const GAP = 2

interface Slice {
  key: string
  label: string
  count: number
  color: string
}

function Donut({ slices, total, centerLabel }: { slices: Slice[]; total: number; centerLabel: string }) {
  const { lang } = useI18n()
  const size = (R + STROKE / 2) * 2 + 4
  const c = size / 2
  let offset = 0
  const visible = slices.filter((x) => x.count > 0)
  return (
    <div className={s.donut}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={c} cy={c} r={R} fill="none" stroke="var(--neutral-soft)" strokeWidth={STROKE} />
        {total > 0 &&
          visible.map((x) => {
            const len = (x.count / total) * C
            const dash = Math.max(0, len - (visible.length > 1 ? GAP : 0))
            const el = (
              <circle
                key={x.key}
                cx={c}
                cy={c}
                r={R}
                fill="none"
                stroke={x.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`}
              />
            )
            offset += len
            return el
          })}
      </svg>
      <div className={s.center}>
        <strong className={`${s.total} tnum`}>{fmtNumber(total, lang)}</strong>
        <span className={s.totalLabel}>{centerLabel}</span>
      </div>
    </div>
  )
}

/** Status mix donut — same colours as the status chips (spec §5.4, right-top). No map here. */
export function ShipmentOverview() {
  const { t, lang } = useI18n()
  const { data, error, isLoading, mutate } = useShipments()
  const c = useMemo(() => (data ? countByStatus(data) : undefined), [data])

  const slices: Slice[] = c
    ? [
        { key: 'inTransit', label: t('dashboard.overview.legend.inTransit'), count: c.inTransit + c.outForDelivery, color: TONE_COLOR[STATUS_META.inTransit.tone] },
        { key: 'atPort', label: t('dashboard.overview.legend.atPort'), count: c.atPort, color: TONE_COLOR[STATUS_META.atPort.tone] },
        { key: 'customs', label: t('dashboard.overview.legend.customs'), count: c.customs, color: TONE_COLOR[STATUS_META.customs.tone] },
        { key: 'delivered', label: t('dashboard.overview.legend.delivered'), count: c.delivered, color: TONE_COLOR[STATUS_META.delivered.tone] },
      ]
    : []
  const other = c ? c.pending + c.exception : 0
  const pct = (n: number) => (c && c.all ? `${Math.round((n / c.all) * 100)}%` : '0%')
  const chartLabel = c
    ? t('dashboard.overview.chartLabel', { total: c.all, parts: slices.map((x) => `${x.label} ${x.count}`).join(', ') })
    : undefined

  return (
    <Card className={s.card}>
      <CardHeader
        icon={<ChartColumn size={26} strokeWidth={2} />}
        title={t('dashboard.overview.title')}
        action={<ViewAllLink href="/analytics">{t('dashboard.overview.viewDetails')}</ViewAllLink>}
      />
      {error && !data ? (
        <ErrorState title={t('dashboard.recent.error')} onRetry={() => void mutate()} />
      ) : isLoading || !c ? (
        <div className={s.body} aria-busy>
          <Skeleton width={138} height={138} radius={69} />
          <div className={s.legend}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={14} />
            ))}
          </div>
        </div>
      ) : (
        <div className={s.body} role="img" aria-label={chartLabel}>
          <Donut slices={[...slices, { key: 'other', label: '', count: other, color: TONE_COLOR.gray }]} total={c.all} centerLabel={t('dashboard.overview.total')} />
          <div className={s.legendWrap} aria-hidden>
            <ul className={s.legend}>
              {slices.map((x) => (
                <li key={x.key} className={s.item}>
                  <span className={s.dot} style={{ background: x.color }} />
                  <span className={s.name}>{x.label}</span>
                  <span className={`${s.count} tnum`}>{fmtNumber(x.count, lang)}</span>
                  <span className={`${s.pct} tnum`}>{pct(x.count)}</span>
                </li>
              ))}
            </ul>
            {other > 0 && <p className={s.other}>{t('dashboard.overview.other', { count: other })}</p>}
          </div>
        </div>
      )}
    </Card>
  )
}
