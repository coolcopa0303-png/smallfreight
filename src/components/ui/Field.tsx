'use client'

import { ChevronDown, Info, X } from 'lucide-react'
import { useId, type ComponentProps, type ReactNode } from 'react'
import s from './ui.module.css'

interface FieldProps {
  label?: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  info?: string
  className?: string
  htmlFor?: string
  children: ReactNode
}

/** Visible label + control + hint/error. Labels never rely on placeholder alone (spec §17). */
export function Field({ label, required, hint, error, info, className, htmlFor, children }: FieldProps) {
  return (
    <div className={[s.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label className={s.label} htmlFor={htmlFor}>
          {label}
          {required && <span className={s.req} aria-hidden>*</span>}
          {info && (
            <span title={info} aria-hidden style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
              <Info size={14} />
            </span>
          )}
        </label>
      )}
      {children}
      {error ? <span className={s.error} role="alert">{error}</span> : hint ? <span className={s.hint}>{hint}</span> : null}
    </div>
  )
}

interface InputProps extends Omit<ComponentProps<'input'>, 'size'> {
  leading?: ReactNode
  trailing?: ReactNode
  addon?: ReactNode
  invalid?: boolean
  onClear?: () => void
}

export function Input({ leading, trailing, addon, invalid, onClear, className, disabled, ...rest }: InputProps) {
  return (
    <div className={[s.control, className].filter(Boolean).join(' ')} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      {leading && <span className={s.leading} aria-hidden>{leading}</span>}
      <input disabled={disabled} aria-invalid={invalid || undefined} {...rest} />
      {onClear && rest.value ? (
        <button type="button" className={s.clearBtn} onClick={onClear} aria-label="Clear">
          <X size={16} />
        </button>
      ) : null}
      {trailing && <span className={s.trailing}>{trailing}</span>}
      {addon && <span className={`${s.trailing} ${s.addon}`}>{addon}</span>}
    </div>
  )
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'size'> {
  leading?: ReactNode
  invalid?: boolean
  options: { value: string; label: string }[]
}

export function Select({ leading, invalid, options, className, disabled, ...rest }: SelectProps) {
  return (
    <div className={[s.control, className].filter(Boolean).join(' ')} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      {leading && <span className={s.leading} aria-hidden>{leading}</span>}
      <select disabled={disabled} aria-invalid={invalid || undefined} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={18} className={s.chevron} aria-hidden />
    </div>
  )
}

export function Checkbox({ label, ...rest }: { label: ReactNode } & Omit<ComponentProps<'input'>, 'type'>) {
  const id = useId()
  return (
    <label className={s.check} htmlFor={rest.id ?? id}>
      <input type="checkbox" id={rest.id ?? id} {...rest} />
      {label}
    </label>
  )
}
