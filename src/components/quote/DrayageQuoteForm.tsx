'use client'

import { Anchor, Container } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Select } from '@/components/ui/Field'
import type { DrayagePort } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import { CONTAINER_TYPES, type ContainerTypeId, type DrayageQuoteInput } from '@/services/quotes'
import { DateInput } from './DateInput'
import { DrayageMoreOptions, type DrayageExtras } from './DrayageMoreOptions'
import { LocationInput } from './LocationInput'
import { isoDay, portLabel, type SummaryRow } from './quoteUtils'
import s from './form.module.css'
import type { LocationField } from './useLocationField'

type Errors = Partial<Record<'port' | 'zip' | 'date' | 'weight', string>>

export function DrayageQuoteForm({ ports, portsState, onRetryPorts, portId, onPort, zip, initialContainer, loading, onSubmit }: {
  ports?: DrayagePort[]
  portsState: 'loading' | 'error' | 'ready'
  onRetryPorts: () => void
  portId?: string
  onPort: (id: string) => void
  zip: LocationField
  initialContainer: ContainerTypeId
  loading: boolean
  onSubmit: (input: DrayageQuoteInput, summary: SummaryRow[]) => void
}) {
  const { t, lang } = useI18n()
  const [container, setContainer] = useState<ContainerTypeId>(initialContainer)
  const [date, setDate] = useState(() => isoDay(1))
  const [more, setMore] = useState(false)
  const [extras, setExtras] = useState<DrayageExtras>({ direction: 'IMPORT', weight: '', weightUnit: 'LBS', description: '', residential: false, other: '' })
  const [errors, setErrors] = useState<Errors>({})
  const ct = CONTAINER_TYPES.find((c) => c.id === container)!
  const maxHint = t('quotes.dray.maxWeight', { lbs: fmtNumber(ct.maxLbs, lang) })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    const port = ports?.find((p) => p.id === portId)
    if (!port) next.port = t('quotes.form.required')
    if (!zip.location) next.zip = zip.text ? t('quotes.form.zipUnresolved') : t('quotes.form.required')
    if (!date) next.date = t('quotes.form.required')
    else if (date < isoDay(0)) next.date = t('quotes.form.datePast')
    const w = Number(extras.weight)
    if (extras.weight && !(w > 0)) next.weight = t('quotes.form.positive')
    else if (w > 0 && (extras.weightUnit === 'KGS' ? w * 2.20462 : w) > ct.maxLbs) next.weight = t('quotes.dray.overMax', { lbs: fmtNumber(ct.maxLbs, lang) })
    if (next.weight) setMore(true)
    setErrors(next)
    if (Object.keys(next).length || !port) {
      const first = Object.keys(next)[0]
      if (first !== 'weight') document.getElementById(`dray-${first}`)?.focus()
      return
    }
    const input: DrayageQuoteInput = {
      portId: port.id,
      destination: zip.location!,
      containerType: container,
      pickupDate: date,
      direction: extras.direction,
      weight: w > 0 ? w : undefined,
      weightUnit: extras.weightUnit,
      description: extras.description.trim() || undefined,
      residentialDelivery: extras.residential,
      other: extras.other.trim() || undefined,
    }
    const loc = zip.location!
    const summary: SummaryRow[] = [
      { label: t('quotes.dray.port'), value: portLabel(port) },
      { label: t('quotes.dray.deliveryTo'), value: `${loc.city}, ${loc.state} ${loc.zip}` },
      { label: t('quotes.dray.container'), value: t(ct.labelKey) },
      { label: t('quotes.form.pickupDate'), value: date },
      { label: t('quotes.dray.jobType'), value: t(`quotes.dray.${extras.direction === 'IMPORT' ? 'import' : 'export'}`) },
    ]
    if (input.weight) summary.push({ label: t('quotes.form.weight'), value: `${fmtNumber(input.weight, lang)} ${input.weightUnit}` })
    if (input.residentialDelivery) summary.push({ label: t('quotes.more.accessorials'), value: t('quotes.accessorial.ResidentialDelivery') })
    if (input.description) summary.push({ label: t('quotes.more.description'), value: input.description })
    if (input.other) summary.push({ label: t('quotes.dray.other'), value: input.other })
    onSubmit(input, summary)
  }

  const portOptions =
    portsState === 'ready' && ports
      ? ports.map((p) => ({ value: p.id, label: portLabel(p) }))
      : [{ value: '', label: portsState === 'loading' ? t('quotes.dray.portsLoading') : t('quotes.dray.portsError') }]

  return (
    <Card className={s.formCard}>
      <form onSubmit={submit} noValidate aria-label={t('quotes.dray.title')}>
        <div className={s.drayRow}>
          <Field
            label={t('quotes.dray.port')}
            required
            htmlFor="dray-port"
            error={errors.port ?? (portsState === 'error' ? <button type="button" className={s.linkBtn} onClick={onRetryPorts}>{t('quotes.dray.portsRetry')}</button> : undefined)}
          >
            <Select
              id="dray-port"
              leading={<Anchor size={18} />}
              value={portId ?? ''}
              disabled={portsState !== 'ready'}
              invalid={!!errors.port}
              onChange={(e) => { onPort(e.target.value); setErrors((x) => ({ ...x, port: undefined })) }}
              options={portOptions}
            />
          </Field>
          <LocationInput
            id="dray-zip"
            label={t('quotes.dray.zip')}
            field={zip}
            error={errors.zip}
            placeholder={t('quotes.dray.zipPh')}
            inputMode="numeric"
            trailingText={zip.location ? `${zip.location.city}, ${zip.location.state}` : undefined}
          />
          <Field label={t('quotes.dray.container')} required htmlFor="dray-container" info={maxHint}>
            <Select
              id="dray-container"
              leading={<Container size={18} />}
              value={container}
              onChange={(e) => setContainer(e.target.value as ContainerTypeId)}
              options={CONTAINER_TYPES.map((c) => ({ value: c.id, label: t(c.labelKey) }))}
            />
          </Field>
          <Field label={t('quotes.form.pickupDate')} required htmlFor="dray-date" error={errors.date}>
            <DateInput id="dray-date" value={date} min={isoDay(0)} onChange={(v) => { setDate(v); setErrors((x) => ({ ...x, date: undefined })) }} invalid={!!errors.date} pickerButton />
          </Field>
          <div className={s.submitCell}>
            <Button type="submit" size="lg" block loading={loading} className={s.submitBtn} disabled={portsState !== 'ready'}>
              {t('quotes.form.getQuotes')}
            </Button>
          </div>
        </div>
        <DrayageMoreOptions value={extras} onChange={(v) => { setExtras(v); setErrors((x) => ({ ...x, weight: undefined })) }} open={more} onToggle={() => setMore((m) => !m)} weightError={errors.weight} maxHint={maxHint} />
      </form>
    </Card>
  )
}
