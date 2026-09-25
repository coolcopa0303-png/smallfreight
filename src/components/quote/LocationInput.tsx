'use client'

import { BookUser, MapPin } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Field, Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { AddressPicker } from './AddressPicker'
import s from './form.module.css'
import type { LocationField } from './useLocationField'

/** "City, State or ZIP" field that resolves to a ZIP (spec §7.2). Optional address-book picker. */
export function LocationInput({ id, label, field, error, placeholder, addressBook, icon, inputMode, trailingText }: {
  id: string
  label: ReactNode
  field: LocationField
  error?: string
  placeholder: string
  addressBook?: boolean
  icon?: ReactNode
  inputMode?: 'numeric' | 'text'
  /** Muted text shown inside the input once resolved (e.g. "Los Angeles, CA" next to a ZIP). */
  trailingText?: string
}) {
  const { t } = useI18n()
  const [picker, setPicker] = useState(false)
  const msg =
    error ??
    (field.status === 'notFound' ? t('quotes.form.locationNotFound') : undefined)
  const hintId = `${id}-status`

  return (
    <Field label={label} required htmlFor={id} error={msg}>
      <Input
        id={id}
        leading={icon ?? <MapPin size={18} />}
        placeholder={placeholder}
        value={field.text}
        inputMode={inputMode}
        autoComplete="off"
        invalid={!!msg}
        aria-describedby={hintId}
        onChange={(e) => field.setText(e.target.value)}
        onBlur={() => field.resolve()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            field.resolve()
          }
        }}
        onClear={field.clear}
        trailing={
          field.status === 'loading' ? (
            <span className={s.inlineSpinner} aria-hidden />
          ) : trailingText && field.status === 'resolved' ? (
            <span className={s.trailingText}>{trailingText}</span>
          ) : addressBook ? (
            <button type="button" className={s.iconBtn} onClick={() => setPicker(true)} aria-label={t('quotes.form.selectAddress')} title={t('quotes.form.selectAddress')}>
              <BookUser size={17} />
            </button>
          ) : undefined
        }
      />
      <span id={hintId} className="sr-only" aria-live="polite">
        {field.status === 'loading' ? t('common.states.loading') : field.status === 'resolved' ? field.text : ''}
      </span>
      {addressBook && (
        <AddressPicker
          open={picker}
          onClose={() => setPicker(false)}
          onPick={(a) => field.resolve(`${a.city}, ${a.state} ${a.zip}`)}
        />
      )}
    </Field>
  )
}
