'use client'

import { AlertTriangle, BarChart3, Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import type { HtsItem } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtMoney, fmtPct } from '@/i18n/format'
import type { DutyResult } from '@/services/dutyCalculator'
import { DetailedBreakdown } from './DetailedBreakdown'
import { fmtUpdated } from './htsUtils'
import s from './results.module.css'

/** Big rate figure with a smaller "%" (reference-v2 06), e.g. 55.10% */
function BigRate({ pct }: { pct?: number }) {
  const str = fmtPct(pct, 2)
  if (!str.endsWith('%')) return <>{str}</>
  return (
    <>
      {str.slice(0, -1)}
      <span className={s.pctSign}>%</span>
    </>
  )
}

export function ResultsCard({ item, value, result, ready, onExport }: {
  item: HtsItem | null
  value: number
  result: DutyResult | null
  /** Inputs are valid but the user hasn't calculated yet. */
  ready: boolean
  onExport: () => void
}) {
  const { t, lang } = useI18n()
  const updated = fmtUpdated(item?.updatedAt, lang)
  const nonAdValorem = result?.warnings.includes('nonAdValorem')
  // Programmes are alternatives, so only nudge when none were selected at all.
  const missingAdditional = item && result && !result.lines.some((l) => l.kind === 'additional') ? item.additionalDuties.length : 0

  return (
    <Card className={s.card}>
      <header className={s.head}>
        <h2 className={s.title}>{t('hts.results.title')}</h2>
        {updated && (
          <span className={s.updated}>
            {t('hts.results.updated', { date: updated })}
            <span title={t('hts.results.updatedInfo')} className={s.infoIcon}>
              <Info size={14} aria-label={t('hts.results.updatedInfo')} />
            </span>
          </span>
        )}
      </header>

      {!result || !item ? (
        <div className={s.empty}>
          <EmptyState icon={<BarChart3 size={22} />} title={t('hts.results.emptyTitle')} body={ready ? t('hts.results.emptyReady') : t('hts.results.emptyBody')} />
        </div>
      ) : (
        <div className={s.body}>
          <div className={s.summary}>
            <section className={`${s.panel} ${s.rateCard}`} aria-labelledby="hts-rate-title">
              <h3 id="hts-rate-title" className={s.panelTitle}>
                {t('hts.results.dutyRate')}
                <span title={t('hts.results.dutyRateInfo')} className={s.infoIcon}>
                  <Info size={16} aria-label={t('hts.results.dutyRateInfo')} />
                </span>
              </h3>
              <p className={`${s.bigRate} tnum`} data-text={nonAdValorem || undefined}>
                {nonAdValorem ? item.baseRateText : <BigRate pct={result.dutyRatePct} />}
              </p>
              <div className={s.rateTotal}>
                <span>{t('hts.cost.duties')}</span>
                <span className={`${s.rateTotalValue} tnum`}>{fmtMoney(result.totalDuties, lang)}</span>
              </div>
            </section>

            <section className={`${s.panel} ${s.costCard}`} aria-labelledby="hts-cost-title">
              <h3 id="hts-cost-title" className={s.panelTitle}>{t('hts.cost.title')}</h3>
              <dl className={s.costList}>
                <div><dt>{t('hts.cost.base')}</dt><dd className="tnum">{fmtMoney(value, lang)}</dd></div>
                <div><dt>{t('hts.cost.duties')}</dt><dd className="tnum">{fmtMoney(result.totalDuties, lang)}</dd></div>
                <div><dt>{t('hts.cost.hmf')}</dt><dd className="tnum">{fmtMoney(result.hmf, lang)}</dd></div>
                <div><dt>{t('hts.cost.mpf')}</dt><dd className="tnum">{fmtMoney(result.mpf, lang)}</dd></div>
                <div className={s.landed}><dt>{t('hts.cost.landed')}</dt><dd className="tnum">{fmtMoney(result.landedCost, lang)}</dd></div>
              </dl>
            </section>
          </div>

          {nonAdValorem && (
            <p className={s.warn} role="note">
              <AlertTriangle size={14} aria-hidden /> {t('hts.warnings.nonAdValorem', { rate: item.baseRateText })}
            </p>
          )}

          <DetailedBreakdown result={result} onExport={onExport} />

          <footer className={s.foot}>
            {missingAdditional > 0 && (
              <p>
                <Info size={13} aria-hidden /> {t('hts.warnings.additionalAvailable', { count: missingAdditional })}
              </p>
            )}
            {item.pga.length > 0 && (
              <p>
                <Info size={13} aria-hidden /> <span className={s.footStrong}>{t('hts.pga.title')}:</span> {item.pga.join(' · ')}
              </p>
            )}
            <p className={s.footRow}>
              <span>{t('hts.disclaimer')}</span>
              {item.updatedAt && <span>{t('hts.source', { date: fmtDate(item.updatedAt, lang) })}</span>}
            </p>
          </footer>
        </div>
      )}
    </Card>
  )
}
