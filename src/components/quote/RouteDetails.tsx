'use client'

import { ClipboardList, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/States'
import { useI18n } from '@/i18n/I18nProvider'
import s from './route.module.css'

export interface PlaceRow {
  label: string
  labelIcon?: ReactNode
  valueIcon?: ReactNode
  value?: string
  sub?: string
  loading?: boolean
}

export interface MetricRow {
  icon: ReactNode
  label: string
  value?: ReactNode
  info?: string
  loading?: boolean
}

/** Right-hand "Route Details" card. Places on top, metrics under a divider (reference 03 / 04). */
export function RouteDetails({ places, metrics, stacked, children, className }: {
  places: PlaceRow[]
  metrics: MetricRow[]
  /** Drayage: label column left, icon + value + small sub-line right. */
  stacked?: boolean
  children?: ReactNode
  className?: string
}) {
  const { t } = useI18n()
  return (
    <Card className={[s.details, className].filter(Boolean).join(' ')} aria-labelledby="route-details-title">
      <h2 id="route-details-title" className={s.detailsTitle}>
        <ClipboardList size={20} className={s.detailsIcon} aria-hidden />
        {t('quotes.route.title')}
      </h2>
      <dl className={stacked ? s.placesStacked : s.places}>
        {places.map((p) => (
          <div key={p.label} className={s.placeRow}>
            <dt className={s.placeLabel}>
              {p.labelIcon && <span className={s.rowIcon} aria-hidden>{p.labelIcon}</span>}
              {p.label}
            </dt>
            <dd className={s.placeValue}>
              {p.valueIcon && <span className={s.valueIcon} aria-hidden>{p.valueIcon}</span>}
              {p.loading ? (
                <Skeleton width={120} height={14} />
              ) : (
                <span className={s.placeText}>
                  <span>{p.value ?? '—'}</span>
                  {p.sub && <small>{p.sub}</small>}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <dl className={s.metrics}>
        {metrics.map((m) => (
          <div key={m.label} className={s.metricRow}>
            <dt className={s.metricLabel}>
              <span className={s.rowIcon} aria-hidden>{m.icon}</span>
              {m.label}
            </dt>
            <dd className={s.metricValue}>
              {m.loading ? <Skeleton width={70} height={14} /> : (m.value ?? '—')}
              {m.info && (
                <span className={s.info} title={m.info} tabIndex={0} aria-label={m.info} role="img">
                  <Info size={17} />
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {children}
    </Card>
  )
}
