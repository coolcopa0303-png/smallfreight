'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney } from '@/i18n/format'
import { FEE_RULES, type DutyLine, type DutyResult } from '@/services/dutyCalculator'
import { cleanCode, fmtRate, localizeDutyLabel } from './htsUtils'
import s from './results.module.css'

/** Human description for each calculator line — fee text is built from FEE_RULES so it never drifts from the maths. */
export function useLineText() {
  const { t, lang } = useI18n()
  return (l: DutyLine) => {
    if (l.kind === 'fee' && l.code === 'HMF')
      return { code: t('hts.detail.hmfCode'), desc: t('hts.detail.hmfDesc', { rate: fmtRate(FEE_RULES.hmfRate * 100) }) }
    if (l.kind === 'fee' && l.code === 'MPF')
      return {
        code: t('hts.detail.mpfCode'),
        desc: t('hts.detail.mpfDesc', { rate: fmtRate(FEE_RULES.mpfRate * 100), min: fmtMoney(FEE_RULES.mpfMin, lang), max: fmtMoney(FEE_RULES.mpfMax, lang) }),
      }
    if (l.kind === 'exclusion')
      return { code: l.code, desc: [l.description, l.note === 'applied' ? t('hts.detail.exclusionApplied') : t('hts.detail.exclusionNotApplied')].filter(Boolean).join(' — ') }
    if (l.kind === 'additional') return { code: l.code, desc: localizeDutyLabel(l.description.replace(/^[\d.]+\s*%\s*-?\s*/, ''), lang, t('hts.additional.china')) }
    return { code: cleanCode(l.code), desc: l.description }
  }
}

export function DetailedBreakdown({ result, onExport }: { result: DutyResult; onExport: () => void }) {
  const { t, lang } = useI18n()
  const text = useLineText()
  const rows = result.lines.filter((l) => l.kind !== 'exclusion')
  const exclusions = result.lines.filter((l) => l.kind === 'exclusion')
  return (
    <section className={`${s.panel} ${s.detail}`} aria-labelledby="hts-detail-title">
      <div className={s.detailHead}>
        <h3 id="hts-detail-title" className={s.panelTitle}>
          {t('hts.detail.title')}
        </h3>
        <Button variant="secondary" size="sm" leading={<Download size={16} />} onClick={onExport} className={s.exportBtn}>
          {t('hts.detail.export')}
        </Button>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <colgroup>
            <col className={s.colCode} />
            <col />
            <col className={s.colRate} />
            <col className={s.colAmount} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">{t('hts.detail.colCode')}</th>
              <th scope="col">{t('hts.detail.colDesc')}</th>
              <th scope="col" className={s.num}>{t('hts.detail.colRate')}</th>
              <th scope="col" className={s.num}>{t('hts.detail.colAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => {
              const { code, desc } = text(l)
              return (
                <tr key={`${l.kind}-${l.code}-${i}`} data-kind={l.kind}>
                  <th scope="row" className="tnum">{l.kind === 'fee' ? <abbr title={t(l.code === 'HMF' ? 'hts.cost.hmf' : 'hts.cost.mpf')}>{code}</abbr> : code}</th>
                  <td>
                    {l.kind === 'additional' ? (
                      <span className={s.dutyChip} title={desc}>{desc}</span>
                    ) : (
                      <span className={s.clamp} title={desc}>{desc}</span>
                    )}
                  </td>
                  <td className={`${s.num} tnum`}>{l.ratePct === undefined ? '—' : fmtRate(l.ratePct)}</td>
                  <td className={`${s.num} ${s.amount} tnum`}>
                    {l.amount === undefined ? <span className={s.mutedCell}>{t('hts.detail.specificRate')}</span> : fmtMoney(l.amount, lang)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {exclusions.length > 0 && (
        <div className={s.exSummary}>
          <span className={s.exSummaryLabel}>{t('hts.detail.exclusions')}</span>
          {exclusions.map((l, i) => (
            <span key={`${l.code}-${i}`} className={s.exChip} data-applied={l.note === 'applied' || undefined} title={l.description || undefined}>
              <span className="tnum">{l.code}</span>
              <span className={s.exChipState}>· {l.note === 'applied' ? t('hts.exclusion.applied') : t('hts.exclusion.notApplied')}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
