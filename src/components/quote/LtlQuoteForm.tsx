'use client'

import { Layers, Package, Truck, Weight } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import type { LtlQuoteInput } from '@/services/quotes'
import { DateInput } from './DateInput'
import { FREIGHT_CLASSES, estimateClass } from './freightClass'
import { LocationInput } from './LocationInput'
import { LtlMoreOptions, type LtlExtras } from './LtlMoreOptions'
import { isoDay, parseDims, type SummaryRow } from './quoteUtils'
import s from './form.module.css'
import type { LocationField } from './useLocationField'

type Errors = Partial<Record<'origin' | 'destination' | 'date' | 'weight' | 'pieces' | 'dims', string>>

export function LtlQuoteForm({ origin, destination, initial, loading, onSubmit }: {
  origin: LocationField
  destination: LocationField
  initial: { weight?: string | null; dims?: string | null; pieces?: string | null }
  loading: boolean
  onSubmit: (input: LtlQuoteInput, summary: SummaryRow[], accessorials: string[]) => void
}) {
  const { t, lang } = useI18n()
  const [date, setDate] = useState(() => isoDay(1))
  const [weight, setWeight] = useState(() => initial.weight?.replace(/[^\d.]/g, '') ?? '')
  const [unit, setUnit] = useState<'LBS' | 'KGS'>('LBS')
  const [pieces, setPieces] = useState(() => initial.pieces?.replace(/\D/g, '') || '1')
  const [cls, setCls] = useState('auto')
  const [more, setMore] = useState(false)
  const [extras, setExtras] = useState<LtlExtras>(() => {
    const d = parseDims(initial.dims)
    return { length: d?.length ?? '', width: d?.width ?? '', height: d?.height ?? '', dimUnit: 'IN', handlingType: 'PLT', description: '', accessorials: [] }
  })
  const [errors, setErrors] = useState<Errors>({})

  const est = useMemo(
    () => estimateClass({ weight: Number(weight), weightUnit: unit, pieces: Number(pieces), length: Number(extras.length), width: Number(extras.width), height: Number(extras.height), dimUnit: extras.dimUnit }),
    [weight, unit, pieces, extras],
  )
  const classOptions = [
    { value: 'auto', label: t('quotes.form.classAuto') },
    ...FREIGHT_CLASSES.map((c) => ({ value: c.cls, label: t('quotes.form.classOption', { cls: c.cls, range: c.max === undefined ? `≥ ${c.min}` : `${c.min}–${c.max}` }) })),
  ]
  const classHint = est
    ? t(cls === 'auto' ? 'quotes.form.classHintAuto' : 'quotes.form.classHintManual', { cls: est.cls, density: fmtNumber(est.density, lang, 1) })
    : t('quotes.form.classHintEmpty')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!origin.location) next.origin = origin.text ? t('quotes.form.locationUnresolved') : t('quotes.form.required')
    if (!destination.location) next.destination = destination.text ? t('quotes.form.locationUnresolved') : t('quotes.form.required')
    if (!date) next.date = t('quotes.form.required')
    else if (date < isoDay(0)) next.date = t('quotes.form.datePast')
    if (!(Number(weight) > 0)) next.weight = t('quotes.form.positive')
    if (!/^\d+$/.test(pieces) || !(Number(pieces) > 0)) next.pieces = t('quotes.form.positiveInt')
    if (!(Number(extras.length) > 0 && Number(extras.width) > 0 && Number(extras.height) > 0)) {
      next.dims = t('quotes.form.dimsRequired')
      setMore(true)
    }
    setErrors(next)
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0]
      if (first !== 'dims') document.getElementById(`ltl-${first}`)?.focus()
      return
    }
    const input: LtlQuoteInput = {
      pickupDate: date,
      origin: origin.location!,
      destination: destination.location!,
      weight: Number(weight),
      weightUnit: unit,
      pieces: Number(pieces),
      length: Number(extras.length),
      width: Number(extras.width),
      height: Number(extras.height),
      dimUnit: extras.dimUnit,
      handlingType: extras.handlingType,
      description: extras.description.trim() || undefined,
      accessorials: extras.accessorials,
    }
    const summary: SummaryRow[] = [
      { label: t('quotes.form.origin'), value: origin.text },
      { label: t('quotes.form.destination'), value: destination.text },
      { label: t('quotes.form.pickupDate'), value: date },
      { label: t('quotes.form.weight'), value: `${fmtNumber(input.weight, lang, 2).replace(/\.00$/, '')} ${unit}` },
      { label: t('quotes.form.pieces'), value: `${input.pieces} × ${t(`quotes.handling.${input.handlingType}`)}` },
      { label: t('quotes.more.dimensions'), value: `${input.length} × ${input.width} × ${input.height} ${input.dimUnit}` },
      { label: t('quotes.form.freightClass'), value: cls === 'auto' ? (est ? t('quotes.form.classEstimated', { cls: est.cls }) : '—') : cls },
    ]
    if (input.description) summary.push({ label: t('quotes.more.description'), value: input.description })
    onSubmit(input, summary, input.accessorials.map((a) => t(`quotes.accessorial.${a}`)))
  }

  const clearErr = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }))

  return (
    <Card className={s.formCard}>
      <form onSubmit={submit} noValidate aria-labelledby="ltl-form-title">
        <h2 id="ltl-form-title" className={s.formTitle}>
          <Truck size={30} className={s.formTitleIcon} aria-hidden fill="currentColor" strokeWidth={1.6} />
          {t('quotes.ltl.shipmentDetails')}
        </h2>
        <div className={s.ltlRow1}>
          <LocationInput id="ltl-origin" label={t('quotes.form.origin')} field={origin} error={errors.origin} placeholder={t('quotes.form.locationPh')} addressBook />
          <LocationInput id="ltl-destination" label={t('quotes.form.destination')} field={destination} error={errors.destination} placeholder={t('quotes.form.locationPh')} addressBook />
          <Field label={t('quotes.form.pickupDate')} required htmlFor="ltl-date" error={errors.date}>
            <DateInput id="ltl-date" value={date} min={isoDay(0)} onChange={(v) => { setDate(v); clearErr('date') }} invalid={!!errors.date} clearable />
          </Field>
        </div>
        <div className={s.ltlRow2}>
          <Field label={t('quotes.form.weight')} required htmlFor="ltl-weight" error={errors.weight}>
            <Input
              id="ltl-weight"
              inputMode="decimal"
              leading={<Weight size={18} />}
              value={weight ? fmtWeight(weight) : ''}
              invalid={!!errors.weight}
              onChange={(e) => { setWeight(e.target.value.replace(/[^\d.]/g, '')); clearErr('weight') }}
              addon={
                <button type="button" className={s.unitToggle} onClick={() => setUnit((u) => (u === 'LBS' ? 'KGS' : 'LBS'))} aria-label={t('quotes.form.toggleUnit', { unit })} title={t('quotes.form.toggleUnit', { unit })}>
                  {unit}
                </button>
              }
            />
          </Field>
          <Field label={t('quotes.form.pieces')} required htmlFor="ltl-pieces" error={errors.pieces}>
            <Input id="ltl-pieces" inputMode="numeric" leading={<Package size={18} />} value={pieces} invalid={!!errors.pieces} onChange={(e) => { setPieces(e.target.value.replace(/\D/g, '')); clearErr('pieces') }} />
          </Field>
          <Field label={t('quotes.form.freightClass')} required htmlFor="ltl-class" info={t('quotes.form.classInfo')}>
            <Select id="ltl-class" leading={<Layers size={18} />} value={cls} onChange={(e) => setCls(e.target.value)} options={classOptions} />
          </Field>
          <div className={s.submitCell}>
            <Button type="submit" size="lg" block loading={loading} className={s.submitBtn}>
              {t('quotes.form.getQuotes')}
            </Button>
          </div>
        </div>
        <LtlMoreOptions value={extras} onChange={(v) => { setExtras(v); clearErr('dims') }} open={more} onToggle={() => setMore((m) => !m)} dimsError={errors.dims} classNote={classHint} />
      </form>
    </Card>
  )
}

/** 2500 → "2,500" while typing (keeps a trailing "." / decimals). */
function fmtWeight(raw: string) {
  const [i, d] = raw.split('.')
  const int = i.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return d !== undefined ? `${int}.${d.slice(0, 2)}` : int
}
