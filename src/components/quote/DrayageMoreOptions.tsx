'use client'

import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useId } from 'react'
import { Checkbox, Field, Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import s from './form.module.css'

export interface DrayageExtras {
  direction: 'IMPORT' | 'EXPORT'
  weight: string
  weightUnit: 'LBS' | 'KGS'
  description: string
  residential: boolean
  other: string
}

/** Old FCL-quote fields kept behind a disclosure: job type, weight, description, residential, notes. */
export function DrayageMoreOptions({ value, onChange, open, onToggle, weightError, maxHint }: {
  value: DrayageExtras
  onChange: (v: DrayageExtras) => void
  open: boolean
  onToggle: () => void
  weightError?: string
  maxHint: string
}) {
  const { t } = useI18n()
  const id = useId()
  const set = <K extends keyof DrayageExtras>(k: K, v: DrayageExtras[K]) => onChange({ ...value, [k]: v })
  const summary = [
    t(`quotes.dray.${value.direction === 'IMPORT' ? 'import' : 'export'}`),
    value.weight ? `${value.weight} ${value.weightUnit}` : null,
    value.residential ? t('quotes.accessorial.ResidentialDelivery') : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className={s.more}>
      <div className={s.moreHead}>
        <button type="button" className={s.moreToggle} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}>
          <SlidersHorizontal size={14} aria-hidden />
          <span>{t('quotes.more.title')}</span>
          <ChevronDown size={14} aria-hidden className={s.chev} data-open={open || undefined} />
        </button>
        <span className={s.moreSummary} data-error={(!!weightError && !open) || undefined}>{summary}</span>
      </div>
      {open && (
        <div id={`${id}-panel`} className={s.morePanel}>
          <div className={s.drayMoreGrid}>
            <Field label={t('quotes.dray.jobType')}>
              <div className={s.segment} role="radiogroup" aria-label={t('quotes.dray.jobType')}>
                {(['IMPORT', 'EXPORT'] as const).map((d) => (
                  <label key={d}>
                    <input type="radio" name={`${id}-dir`} checked={value.direction === d} onChange={() => set('direction', d)} />
                    {t(`quotes.dray.${d === 'IMPORT' ? 'import' : 'export'}`)}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={t('quotes.form.weight')} htmlFor={`${id}-w`} error={weightError} hint={maxHint}>
              <Input
                id={`${id}-w`}
                inputMode="decimal"
                value={value.weight}
                invalid={!!weightError}
                onChange={(e) => set('weight', e.target.value.replace(/[^\d.]/g, ''))}
                addon={
                  <button type="button" className={s.unitToggle} onClick={() => set('weightUnit', value.weightUnit === 'LBS' ? 'KGS' : 'LBS')} aria-label={t('quotes.form.toggleUnit', { unit: value.weightUnit })}>
                    {value.weightUnit}
                  </button>
                }
              />
            </Field>
            <Field label={t('quotes.more.description')} htmlFor={`${id}-d`}>
              <Input id={`${id}-d`} value={value.description} maxLength={200} placeholder={t('quotes.more.descriptionPh')} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label={t('quotes.dray.other')} htmlFor={`${id}-o`}>
              <Input id={`${id}-o`} value={value.other} maxLength={300} placeholder={t('quotes.dray.otherPh')} onChange={(e) => set('other', e.target.value)} />
            </Field>
          </div>
          <div className={s.checkRow}>
            <Checkbox label={t('quotes.accessorial.ResidentialDelivery')} checked={value.residential} onChange={(e) => set('residential', e.target.checked)} />
          </div>
        </div>
      )}
    </div>
  )
}
