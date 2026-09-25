'use client'

import { AlertTriangle, BarChart3, Coins, Info, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import type { HtsItem } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtMoney, fmtPct } from '@/i18n/format'
import type { DutyResult } from '@/services/dutyCalculator'
import { DetailedBreakdown } from './DetailedBreakdown'
import { fmtUpdated } from './htsUtils'
import s from './results.module.css'

/** Big money figure with smaller cents, e.g. $145.37 */
function BigMoney({ n }: { n?: number }) {
  const { lang } = useI18n()
  if (n === undefined) return <>—</>
  const str = fmtMoney(n, lang, 2)
  const cut = str.lastIndexOf('.')
  return (
    <>
      {str.slice(0, cut)}
      <span className={s.cents}>{str.slice(cut)}</span>
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
      <CardHeader
        icon={<BarChart3 size={28} strokeWidth={2.2} />}
        title={t('hts.results.title')}
        className={s.head}
        action={
          updated ? (
            <span className={s.updated}>
              {t('hts.results.updated', { date: updated })}
              <span title={t('hts.results.updatedInfo')} className={s.infoIcon}>
                <Info size={15} aria-label={t('hts.results.updatedInfo')} />
              </span>
            </span>
          ) : undefined
        }
      />

      {!result || !item ? (
        <div className={s.empty}>
          <EmptyState icon={<BarChart3 size={22} />} title={t('hts.results.emptyTitle')} body={ready ? t('hts.results.emptyReady') : t('hts.results.emptyBody')} />
        </div>
      ) : (
        <div className={s.body}>
          <div className={s.summary}>
            <div className={s.metric}>
              <span className={s.metricLabel}>
                {t('hts.results.dutyRate')}
                <span title={t('hts.results.dutyRateInfo')} className={s.infoIcon}>
                  <Info size={15} aria-label={t('hts.results.dutyRateInfo')} />
                </span>
              </span>
              <span className={`${s.bigRate} tnum`}>{nonAdValorem ? item.baseRateText : fmtPct(result.dutyRatePct, 2)}</span>
            </div>
            <span className={s.divider} aria-hidden />
            <div className={s.metric}>
              <span className={s.metricLabel}>{t('hts.results.totalDuties')}</span>
              <span className={`${s.bigMoney} tnum`}>
                <BigMoney n={result.totalDuties} />
              </span>
            </div>
          </div>

          {nonAdValorem && (
            <p className={s.warn} role="note">
              <AlertTriangle size={16} aria-hidden /> {t('hts.warnings.nonAdValorem', { rate: item.baseRateText })}
            </p>
          )}

          <section className={s.panel} aria-labelledby="hts-cost-title">
            <h3 id="hts-cost-title" className={s.panelTitle}>
              <Coins size={24} aria-hidden className={s.panelIcon} />
              {t('hts.cost.title')}
            </h3>
            <dl className={s.costList}>
              <div><dt>{t('hts.cost.base')}</dt><dd className="tnum">{fmtMoney(value, lang)}</dd></div>
              <div><dt>{t('hts.cost.duties')}</dt><dd className="tnum">{fmtMoney(result.totalDuties, lang)}</dd></div>
              <div><dt>{t('hts.cost.hmf')}</dt><dd className="tnum">{fmtMoney(result.hmf, lang)}</dd></div>
              <div><dt>{t('hts.cost.mpf')}</dt><dd className="tnum">{fmtMoney(result.mpf, lang)}</dd></div>
              <div className={s.landed}><dt>{t('hts.cost.landed')}</dt><dd className="tnum">{fmtMoney(result.landedCost, lang)}</dd></div>
            </dl>
          </section>

          <DetailedBreakdown result={result} onExport={onExport} />

          {missingAdditional > 0 && (
            <p className={s.hint}>
              <Info size={14} aria-hidden /> {t('hts.warnings.additionalAvailable', { count: missingAdditional })}
            </p>
          )}

          {item.pga.length > 0 && (
            <section className={s.pga} aria-labelledby="hts-pga-title">
              <h3 id="hts-pga-title" className={s.pgaTitle}>
                <ShieldCheck size={16} aria-hidden /> {t('hts.pga.title')}
              </h3>
              <ul>
                {item.pga.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          <footer className={s.foot}>
            <p className={s.disclaimer}>
              <AlertTriangle size={14} aria-hidden /> {t('hts.disclaimer')}
            </p>
            {item.updatedAt && <p>{t('hts.source', { date: fmtDate(item.updatedAt, lang) })}</p>}
          </footer>
        </div>
      )}
    </Card>
  )
}
