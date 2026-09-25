'use client'

import { CalendarDays } from 'lucide-react'
import { useRef } from 'react'
import { Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import s from './form.module.css'

/** Native date input with the design's leading calendar icon; the whole box opens the picker. */
export function DateInput({ id, value, onChange, min, invalid, clearable, pickerButton }: {
  id: string
  value: string
  onChange: (v: string) => void
  min?: string
  invalid?: boolean
  clearable?: boolean
  pickerButton?: boolean
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLInputElement>(null)
  const open = () => {
    try {
      ref.current?.showPicker?.()
    } catch {
      // showPicker unsupported / not user-activated — native input still works
    }
  }
  return (
    <Input
      ref={ref}
      id={id}
      type="date"
      className={s.date}
      leading={<CalendarDays size={18} />}
      value={value}
      min={min}
      invalid={invalid}
      required
      onChange={(e) => onChange(e.target.value)}
      onClick={open}
      onClear={clearable ? () => onChange('') : undefined}
      trailing={
        pickerButton ? (
          <button type="button" className={s.iconBtn} onClick={open} aria-label={t('quotes.form.openCalendar')} tabIndex={-1}>
            <CalendarDays size={17} />
          </button>
        ) : undefined
      }
    />
  )
}
