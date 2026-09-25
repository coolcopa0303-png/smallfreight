'use client'

import { useId } from 'react'
import type { AdditionalDuty } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtRate, localizeDutyLabel } from './htsUtils'
import s from './calculator.module.css'

/**
 * Additional duty programmes parsed from the backend's free text. They are alternatives /
 * conditional (origin, product scope), so nothing is pre-selected and nothing is auto-summed.
 */
export function AdditionalDuties({ items, selected, onToggle }: { items: AdditionalDuty[]; selected: string[]; onToggle: (id: string) => void }) {
  const { t, lang } = useI18n()
  const headId = useId()
  const hintId = useId()
  if (!items.length) return null
  return (
    <fieldset className={s.addBox} aria-describedby={hintId}>
      <legend id={headId} className={s.sectionLabel}>
        {t('hts.additional.title')}
        {selected.length > 0 && <span className={s.countTag}>{t('hts.additional.selectedCount', { count: selected.length })}</span>}
      </legend>
      <p id={hintId} className={s.muted}>{t('hts.additional.hint')}</p>
      <div className={s.addList}>
        {items.map((a) => (
          <label key={a.id} className={s.addRow} data-checked={selected.includes(a.id) || undefined}>
            <input type="checkbox" checked={selected.includes(a.id)} onChange={() => onToggle(a.id)} disabled={a.ratePct === undefined} />
            <span className={s.addRate}>{a.ratePct === undefined ? t('hts.additional.rateUnknown') : fmtRate(a.ratePct)}</span>
            <span className={s.addLabel}>{localizeDutyLabel(a.label, lang, t('hts.additional.china'))}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
