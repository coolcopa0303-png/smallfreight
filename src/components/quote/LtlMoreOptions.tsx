'use client'

import { ChevronDown, Layers, SlidersHorizontal } from 'lucide-react'
import { useId, useState } from 'react'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { HANDLING_TYPES, LTL_ACCESSORIALS, LTL_COMMON_ACCESSORIALS } from '@/services/quotes'
import type { DimUnit } from './freightClass'
import s from './form.module.css'

export interface LtlExtras {
  length: string
  width: string
  height: string
  dimUnit: DimUnit
  handlingType: string
  description: string
  accessorials: string[]
}

const DIM_UNITS: DimUnit[] = ['IN', 'FT', 'CM', 'M']
const RARE = LTL_ACCESSORIALS.filter((a) => !(LTL_COMMON_ACCESSORIALS as readonly string[]).includes(a))

/** Old-API fields the design has no room for: dimensions, handling, description, all 21 accessorials. */
export function LtlMoreOptions({ value, onChange, open, onToggle, dimsError, classNote }: {
  value: LtlExtras
  onChange: (v: LtlExtras) => void
  open: boolean
  onToggle: () => void
  dimsError?: string
  /** Density-estimated freight class, shown at the end of the disclosure row. */
  classNote?: string
}) {
  const { t } = useI18n()
  const id = useId()
  const [showAll, setShowAll] = useState(() => value.accessorials.some((a) => RARE.includes(a as (typeof RARE)[number])))
  const set = <K extends keyof LtlExtras>(k: K, v: LtlExtras[K]) => onChange({ ...value, [k]: v })
  const toggleAcc = (code: string) =>
    set('accessorials', value.accessorials.includes(code) ? value.accessorials.filter((c) => c !== code) : [...value.accessorials, code])
  const hasDims = value.length && value.width && value.height
  const summary = [
    t(`quotes.handling.${value.handlingType}`),
    hasDims ? `${value.length} × ${value.width} × ${value.height} ${value.dimUnit.toLowerCase()}` : t('quotes.more.noDims'),
    value.accessorials.length ? t('quotes.more.accCount', { count: value.accessorials.length }) : t('quotes.more.noAcc'),
  ].join(' · ')

  return (
    <div className={s.more}>
      <div className={s.moreHead}>
        <button type="button" className={s.moreToggle} aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}>
          <SlidersHorizontal size={14} aria-hidden />
          <span>{t('quotes.more.title')}</span>
          <ChevronDown size={14} aria-hidden className={s.chev} data-open={open || undefined} />
        </button>
        <span className={s.moreSummary} data-error={(!!dimsError && !open) || undefined}>{summary}</span>
        {classNote && (
          <span className={s.classNote} aria-live="polite">
            <Layers size={13} aria-hidden />
            {classNote}
          </span>
        )}
      </div>
      {open && (
        <div id={`${id}-panel`} className={s.morePanel}>
          <div className={s.moreGrid}>
            <Field label={t('quotes.more.dimensions')} required error={dimsError} htmlFor={`${id}-l`} className={s.dimsField}>
              <div className={s.dims}>
                {(['length', 'width', 'height'] as const).map((k, i) => (
                  <Input
                    key={k}
                    id={i === 0 ? `${id}-l` : undefined}
                    inputMode="decimal"
                    placeholder={t(`quotes.more.${k}Short`)}
                    aria-label={t(`quotes.more.${k}`)}
                    value={value[k]}
                    invalid={!!dimsError && !(Number(value[k]) > 0)}
                    onChange={(e) => set(k, e.target.value.replace(/[^\d.]/g, ''))}
                  />
                ))}
                <Select
                  aria-label={t('quotes.more.dimUnit')}
                  className={s.unitSelect}
                  value={value.dimUnit}
                  onChange={(e) => set('dimUnit', e.target.value as DimUnit)}
                  options={DIM_UNITS.map((u) => ({ value: u, label: u }))}
                />
              </div>
            </Field>
            <Field label={t('quotes.more.handling')} required htmlFor={`${id}-h`}>
              <Select
                id={`${id}-h`}
                value={value.handlingType}
                onChange={(e) => set('handlingType', e.target.value)}
                options={HANDLING_TYPES.map((h) => ({ value: h, label: t(`quotes.handling.${h}`) }))}
              />
            </Field>
            <Field label={t('quotes.more.description')} htmlFor={`${id}-d`}>
              <Input id={`${id}-d`} value={value.description} maxLength={200} placeholder={t('quotes.more.descriptionPh')} onChange={(e) => set('description', e.target.value)} />
            </Field>
          </div>
          <fieldset className={s.accs}>
            <legend className={s.accLegend}>{t('quotes.more.accessorials')}</legend>
            <div className={s.accGrid}>
              {(showAll ? LTL_ACCESSORIALS : LTL_COMMON_ACCESSORIALS).map((code) => (
                <Checkbox key={code} label={t(`quotes.accessorial.${code}`)} checked={value.accessorials.includes(code)} onChange={() => toggleAcc(code)} />
              ))}
            </div>
            <button type="button" className={s.linkBtn} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
              {showAll ? t('quotes.more.fewerAcc') : t('quotes.more.moreAcc', { count: RARE.length })}
            </button>
          </fieldset>
        </div>
      )}
    </div>
  )
}
