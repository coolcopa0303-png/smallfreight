'use client'

import { Info, PlusCircle, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import type { ExclusionCode } from '@/services/dutyCalculator'
import s from './calculator.module.css'

/** Removable exclusion rows (reference 06). Recorded for the broker; never deducted by the estimator. */
export function ExclusionCodes({ items, onAdd, onToggle, onRemove }: {
  items: ExclusionCode[]
  onAdd: (code: string, note?: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const { t } = useI18n()
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState(false)
  const headId = useId()
  const codeId = useId()
  const noteId = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!code.trim()) return setErr(true)
    onAdd(code.trim(), note.trim())
    setCode('')
    setNote('')
    setErr(false)
    setAdding(false)
  }

  return (
    <div className={s.section} role="group" aria-labelledby={headId}>
      <p id={headId} className={s.sectionLabel}>
        {t('hts.exclusion.title')}
        <span className={s.info} title={t('hts.exclusion.info')}>
          <Info size={14} aria-label={t('hts.exclusion.info')} />
        </span>
      </p>
            {items.length > 0 && (
        <ul className={s.exList}>
          {items.map((e) => {
            const state = e.applied ? t('hts.exclusion.applied') : t('hts.exclusion.notApplied')
            return (
              <li key={e.id} className={s.exRow} data-applied={e.applied || undefined}>
                <span className={`${s.exCode} tnum`}>{e.code}</span>
                {e.note && <span className={s.exNote}>{e.note}</span>}
                <button
                  type="button"
                  className={s.exState}
                  aria-pressed={e.applied}
                  onClick={() => onToggle(e.id)}
                  aria-label={t('hts.exclusion.toggle', { code: e.code, state: e.applied ? t('hts.exclusion.notApplied') : t('hts.exclusion.applied') })}
                >
                  {state}
                </button>
                <button type="button" className={s.exRemove} onClick={() => onRemove(e.id)} aria-label={t('hts.exclusion.remove', { code: e.code })}>
                  <X size={17} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {adding ? (
        <form className={s.exForm} onSubmit={submit}>
          <div className={s.exFormFields}>
            <label className="sr-only" htmlFor={codeId}>{t('hts.exclusion.code')}</label>
            <Input id={codeId} value={code} invalid={err} placeholder={t('hts.exclusion.codePlaceholder')} onChange={(e) => setCode(e.target.value)} aria-describedby={err ? `${codeId}-err` : undefined} data-autofocus autoFocus />
            <label className="sr-only" htmlFor={noteId}>{t('hts.exclusion.note')}</label>
            <Input id={noteId} value={note} placeholder={t('hts.exclusion.notePlaceholder')} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className={s.exFormActions}>
            <Button type="submit" size="sm">{t('common.actions.add')}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setErr(false) }}>{t('common.actions.cancel')}</Button>
          </div>
          {err && <span id={`${codeId}-err`} className={s.errorText} role="alert">{t('hts.exclusion.codeRequired')}</span>}
        </form>
      ) : (
        <div className={s.addBar}>
          <Button variant="secondary" size="sm" className={s.addBtn} leading={<PlusCircle size={16} />} onClick={() => setAdding(true)}>
            {t('hts.exclusion.add')}
          </Button>
          {items.some((e) => e.applied) && <p className={s.muted}>{t('hts.exclusion.notComputed')}</p>}
        </div>
      )}
    </div>
  )
}
