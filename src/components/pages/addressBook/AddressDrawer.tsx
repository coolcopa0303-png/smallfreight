'use client'

import { Loader2 } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Flag } from '@/components/ui/misc'
import { Drawer } from '@/components/ui/Overlay'
import type { AddressEntry } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { lookupZip } from '@/services/geo'
import { COUNTRIES, fromForm, regionName, toForm, validate, type FormErrors, type FormField, type FormValues } from './addressForm'
import s from './addressBook.module.css'

interface Props {
  open: boolean
  /** Entry being edited; undefined = create. */
  entry?: AddressEntry
  onClose: () => void
  onSubmit: (values: Omit<AddressEntry, 'id'>) => void
  saving?: boolean
}

const FORM_ID = 'address-book-form'

export function AddressDrawer({ open, entry, onClose, onSubmit, saving = false }: Props) {
  const { t } = useI18n()
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={entry ? t('addressBook.editTitle') : t('addressBook.addTitle')}
      footer={
        <div className={s.drawerFoot}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>{t('common.actions.cancel')}</Button>
          <Button type="submit" form={FORM_ID} loading={saving}>{t('common.actions.save')}</Button>
        </div>
      }
    >
      {/* keyed so the form state resets for each open */}
      {open && <AddressForm key={entry?.id ?? 'new'} entry={entry} onSubmit={onSubmit} saving={saving} />}
    </Drawer>
  )
}

function AddressForm({ entry, onSubmit, saving }: { entry?: AddressEntry; onSubmit: Props['onSubmit']; saving: boolean }) {
  const { t, lang } = useI18n()
  const [v, setV] = useState<FormValues>(() => toForm(entry))
  const [errors, setErrors] = useState<FormErrors>({})
  const [zipState, setZipState] = useState<'idle' | 'loading' | 'filled' | 'notFound'>('idle')
  const zipSeq = useRef(0)

  const countryOptions = useMemo(
    () => COUNTRIES.map((c) => ({ value: c, label: regionName(c, lang) })),
    [lang],
  )

  const set = (k: FormField, val: string) => {
    setV((p) => ({ ...p, [k]: val }))
    if (errors[k] || ((k === 'company' || k === 'firstName' || k === 'lastName') && errors.company)) {
      setErrors((p) => {
        const n = { ...p }
        delete n[k]
        if (k === 'company' || k === 'firstName' || k === 'lastName') {
          delete n.company
          delete n.firstName
        }
        return n
      })
    }
  }

  const onZip = async (zip: string) => {
    set('zip', zip)
    const seq = ++zipSeq.current
    if (v.country !== 'US' || !/^\d{5}$/.test(zip)) {
      setZipState('idle')
      return
    }
    setZipState('loading')
    const loc = await lookupZip(zip).catch(() => undefined)
    if (seq !== zipSeq.current) return
    if (!loc) {
      setZipState('notFound')
      return
    }
    setV((p) => ({ ...p, city: loc.city, state: loc.state }))
    setErrors((p) => ({ ...p, city: undefined, state: undefined }))
    setZipState('filled')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(v)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      document.getElementById(`ab-${first}`)?.focus()
      return
    }
    onSubmit(fromForm(v))
  }

  const err = (k: FormField) => (errors[k] ? t(`addressBook.errors.${errors[k]}`) : undefined)
  const input = (k: FormField, extra?: Partial<Parameters<typeof Input>[0]>) => (
    <Input id={`ab-${k}`} value={v[k]} invalid={!!errors[k]} onChange={(e) => set(k, e.target.value)} {...extra} />
  )
  const zipHint =
    zipState === 'filled' ? t('addressBook.zipFilled') : zipState === 'notFound' ? t('addressBook.zipNotFound') : v.country === 'US' ? t('addressBook.zipHint') : undefined

  return (
    <form id={FORM_ID} className={s.form} onSubmit={submit} noValidate aria-busy={saving || undefined}>
      <fieldset className={s.fieldset} disabled={saving}>
        <legend className={s.legend}>{t('addressBook.sectionAddress')}</legend>
        <Field label={t('addressBook.fields.company')} htmlFor="ab-company" error={err('company')} className={s.full}>
          {input('company', { autoComplete: 'organization' })}
        </Field>
        <Field label={t('addressBook.fields.street')} required htmlFor="ab-street" error={err('street')} className={s.full}>
          {input('street', { autoComplete: 'address-line1' })}
        </Field>
        <Field
          label={<>{t('addressBook.fields.street2')} <span className={s.optional}>({t('common.optional')})</span></>}
          htmlFor="ab-street2"
          className={s.full}
        >
          {input('street2', { autoComplete: 'address-line2' })}
        </Field>
        <Field label={t('addressBook.fields.country')} required htmlFor="ab-country" error={err('country')}>
          <Select
            id="ab-country"
            value={v.country}
            options={countryOptions}
            leading={<Flag code={v.country} width={20} />}
            onChange={(e) => {
              set('country', e.target.value)
              setZipState('idle')
            }}
          />
        </Field>
        <Field label={t('addressBook.fields.zip')} required htmlFor="ab-zip" error={err('zip')} hint={zipHint}>
          <Input
            id="ab-zip"
            value={v.zip}
            invalid={!!errors.zip}
            inputMode={v.country === 'US' ? 'numeric' : undefined}
            maxLength={v.country === 'US' ? 5 : 12}
            autoComplete="postal-code"
            onChange={(e) => onZip(v.country === 'US' ? e.target.value.replace(/\D/g, '') : e.target.value)}
            trailing={zipState === 'loading' ? <Loader2 size={16} className={s.spin} aria-label={t('common.states.loading')} /> : undefined}
          />
        </Field>
        <Field label={t('addressBook.fields.city')} required htmlFor="ab-city" error={err('city')}>
          {input('city', { autoComplete: 'address-level2' })}
        </Field>
        <Field label={t('addressBook.fields.state')} required htmlFor="ab-state" error={err('state')}>
          {input('state', { autoComplete: 'address-level1' })}
        </Field>
      </fieldset>

      <fieldset className={s.fieldset} disabled={saving}>
        <legend className={s.legend}>{t('addressBook.sectionContact')}</legend>
        <Field label={t('addressBook.fields.firstName')} htmlFor="ab-firstName" error={err('firstName')}>
          {input('firstName', { autoComplete: 'given-name' })}
        </Field>
        <Field label={t('addressBook.fields.lastName')} htmlFor="ab-lastName">
          {input('lastName', { autoComplete: 'family-name' })}
        </Field>
        <Field label={t('addressBook.fields.phone')} htmlFor="ab-phone" error={err('phone')}>
          {input('phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
        </Field>
        <Field label={t('addressBook.fields.phoneExt')} htmlFor="ab-phoneExt" error={err('phoneExt')}>
          {input('phoneExt', { inputMode: 'numeric', maxLength: 6 })}
        </Field>
        <Field label={t('addressBook.fields.email')} htmlFor="ab-email" error={err('email')} className={s.full}>
          {input('email', { type: 'email', autoComplete: 'email' })}
        </Field>
      </fieldset>
      <p className={s.formNote}>{t('addressBook.requiredNote')}</p>
    </form>
  )
}
