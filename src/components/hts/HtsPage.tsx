'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney } from '@/i18n/format'
import { calculateDuties } from '@/services/dutyCalculator'
import { AskTeamModal } from './AskTeamModal'
import { CalculatorCard } from './CalculatorCard'
import { useLineText } from './DetailedBreakdown'
import { ResultsCard } from './ResultsCard'
import { cleanCode, downloadCsv, fmtRate, localizeDutyLabel } from './htsUtils'
import { useSavedCalcs } from './savedCalcs'
import { useDutyForm } from './useDutyForm'
import s from './page.module.css'

/** HTS Search / Duty Calculator (reference 06, spec §10). Must render inside <Suspense> (useSearchParams). */
export function HtsPage() {
  const { t, lang } = useI18n()
  const toast = useToast()
  const params = useSearchParams()
  const api = useDutyForm()
  const saved = useSavedCalcs()
  const lineText = useLineText()
  const [askOpen, setAskOpen] = useState(false)
  const { form, result } = api

  const onCalculate = () => {
    if (!api.calculate()) toast(t(!form.item ? 'hts.validation.item' : 'hts.validation.value'), 'error')
  }

  const onSave = () => {
    if (!api.valid || !form.item) {
      api.touch()
      toast(t('hts.toast.saveNeedsInput'), 'error')
      return
    }
    const selected = form.item.additionalDuties.filter((a) => form.selectedAdditional.includes(a.id))
    // Saving doesn't require clicking Calculate first — compute with the same service.
    const r = result ?? calculateDuties({ item: form.item, value: api.valueNum, mode: form.mode, selectedAdditional: selected, exclusions: form.exclusions })
    saved.add({
      htsCode: cleanCode(form.item.htsCode),
      description: form.item.description,
      value: api.valueNum,
      origin: form.origin,
      mode: form.mode,
      entryDate: form.entryDate,
      ladingDate: form.ladingDate,
      dutyRatePct: r.dutyRatePct,
      totalDuties: r.totalDuties,
      landedCost: r.landedCost,
      additional: selected.map((a) => `${fmtRate(a.ratePct)} ${localizeDutyLabel(a.label, lang, t('hts.additional.china'))}`),
      exclusions: form.exclusions.map((e) => `${e.code}${e.applied ? ' (applied)' : ''}`),
    })
    toast(t('hts.toast.saved'))
  }

  const onExport = () => {
    if (!result || !form.item) return
    const code = cleanCode(form.item.htsCode)
    const rows: (string | number | undefined)[][] = [
      [t('hts.detail.colCode'), t('hts.detail.colDesc'), t('hts.detail.colRate'), t('hts.detail.colAmount')],
      ...result.lines.map((l) => {
        const x = lineText(l)
        return [x.code, x.desc, l.ratePct === undefined ? '' : fmtRate(l.ratePct), l.amount === undefined ? '' : l.amount.toFixed(2)]
      }),
      [],
      [t('hts.csv.summary')],
      [t('hts.cost.base'), '', '', api.valueNum.toFixed(2)],
      [t('hts.results.dutyRate'), '', result.dutyRatePct === undefined ? form.item.baseRateText : fmtRate(result.dutyRatePct), ''],
      [t('hts.cost.duties'), '', '', result.totalDuties?.toFixed(2)],
      [t('hts.cost.hmf'), '', '', result.hmf.toFixed(2)],
      [t('hts.cost.mpf'), '', '', result.mpf.toFixed(2)],
      [t('hts.cost.landed'), '', '', result.landedCost?.toFixed(2)],
      [],
      [t('hts.calc.origin'), form.origin],
      [t('hts.calc.mode'), t(`common.mode.${form.mode}`)],
      [t('hts.calc.entryDate'), form.entryDate],
      [t('hts.calc.ladingDate'), form.ladingDate],
      [t('hts.disclaimer')],
    ]
    downloadCsv(t('hts.csv.filename', { code }), rows)
    toast(t('hts.toast.exported'))
  }

  const q = params.get('q') ?? undefined

  return (
    <div className={s.page}>
      <PageHero image="ship" height={124} title={t('hts.hero.title')} subtitle={t('hts.hero.subtitle')} position="center 38%" />
      <div className={s.columns}>
        <CalculatorCard api={api} initialQuery={q} onSave={onSave} onAsk={() => setAskOpen(true)} onCalculate={onCalculate} />
        <ResultsCard item={form.item} value={api.valueNum} result={result} ready={api.valid && !api.calculated} onExport={onExport} />
      </div>
      {askOpen && <AskTeamModal open onClose={() => setAskOpen(false)} />}
      <span className="sr-only" aria-live="polite">
        {result?.landedCost !== undefined ? `${t('hts.cost.landed')}: ${fmtMoney(result.landedCost, lang)}` : ''}
      </span>
    </div>
  )
}
