'use client'

import { Check, ChevronDown, Info, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import type { ExclusionCode } from '@/services/dutyCalculator'
import s from './calculator.module.css'

/**
 * Exclusion codes as one multi-select-style field of removable chips (reference-v2 06).
 * Clicking a code chip toggles "applied"; the chevron opens the add form. Recorded for the broker;
 * never deducted by the estimator.
 */
export function ExclusionCodes({
  items,
  onAdd,
  onToggle,
  onRemove,
}: {
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
  const wrapRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const headId = useId()
  const hintId = useId()
  const panelId = useId()
  const codeId = useId()
  const noteId = useId()

  const close = (focusToggle = false) => {
    setAdding(false)
    setErr(false)
    if (focusToggle) toggleRef.current?.focus()
  }

  // Close the add panel on outside click.
  useEffect(() => {
    if (!adding) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return
      setAdding(false)
      setErr(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [adding])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!code.trim()) return setErr(true)
    onAdd(code.trim(), note.trim())
    setCode('')
    setNote('')
    close(true)
  }

  return (
    <div className={s.section} role="group" aria-labelledby={headId} ref={wrapRef}>
      <p id={headId} className={s.sectionLabel}>
        {t('hts.exclusion.title')}
        <span className={s.info} title={t('hts.exclusion.info')}>
          <Info size={14} aria-label={t('hts.exclusion.info')} />
        </span>
      </p>
      <p id={hintId} className="sr-only">
        {t('hts.exclusion.toggleHint')}
      </p>

      <div className={s.exField} data-open={adding || undefined}>
        {items.length > 0 ? (
          <ul className={s.exList} aria-describedby={hintId}>
            {items.map((e) => (
              <li key={e.id} className={s.exItem}>
                <span className={s.exCodeChip} data-applied={e.applied || undefined}>
                  <button
                    type="button"
                    className={`${s.exChip} tnum`}
                    aria-pressed={e.applied}
                    onClick={() => onToggle(e.id)}
                    title={t('hts.exclusion.toggle', {
                      code: e.code,
                      state: e.applied ? t('hts.exclusion.notApplied') : t('hts.exclusion.applied'),
                    })}
                  >
                    {e.applied && <Check size={13} strokeWidth={2.6} aria-hidden />}
                    {e.code}
                    <span className="sr-only"> ({e.applied ? t('hts.exclusion.applied') : t('hts.exclusion.notApplied')})</span>
                  </button>
                  <button type="button" className={s.exChipX} onClick={() => onRemove(e.id)} aria-label={t('hts.exclusion.remove', { code: e.code })}>
                    <X size={14} />
                  </button>
                </span>
                {e.note && (
                  <span className={s.exNoteChip} title={e.note}>
                    {e.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <button type="button" className={s.exPlaceholder} onClick={() => setAdding(true)} tabIndex={-1} aria-hidden>
            {t('hts.exclusion.placeholder')}
          </button>
        )}
        <div className={s.exTools}>
          {items.length > 0 && (
            <button
              type="button"
              className={s.exTool}
              onClick={() => items.forEach((e) => onRemove(e.id))}
              aria-label={t('hts.exclusion.clearAll')}
              title={t('hts.exclusion.clearAll')}
            >
              <X size={17} />
            </button>
          )}
          <button
            ref={toggleRef}
            type="button"
            className={s.exTool}
            aria-label={t('hts.exclusion.add')}
            title={t('hts.exclusion.add')}
            aria-expanded={adding}
            aria-controls={panelId}
            onClick={() => (adding ? close() : setAdding(true))}
          >
            <ChevronDown size={18} className={s.exChevron} />
          </button>
        </div>
      </div>

      {adding && (
        <form
          id={panelId}
          className={s.exPanel}
          onSubmit={submit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              close(true)
            }
          }}
        >
          <div className={s.exFormFields}>
            <label className="sr-only" htmlFor={codeId}>
              {t('hts.exclusion.code')}
            </label>
            <Input
              id={codeId}
              value={code}
              invalid={err}
              placeholder={t('hts.exclusion.codePlaceholder')}
              onChange={(e) => setCode(e.target.value)}
              aria-describedby={err ? `${codeId}-err` : undefined}
              autoFocus
            />
            <label className="sr-only" htmlFor={noteId}>
              {t('hts.exclusion.note')}
            </label>
            <Input id={noteId} value={note} placeholder={t('hts.exclusion.notePlaceholder')} onChange={(e) => setNote(e.target.value)} />
          </div>
          {err && (
            <span id={`${codeId}-err`} className={s.errorText} role="alert">
              {t('hts.exclusion.codeRequired')}
            </span>
          )}
          <div className={s.exPanelFoot}>
            <p className={s.muted}>
              {t('hts.exclusion.notComputed')} {t('hts.exclusion.toggleHint')}
            </p>
            <div className={s.exFormActions}>
              <Button size="sm" variant="ghost" onClick={() => close(true)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" size="sm">
                {t('common.actions.add')}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
