'use client'

import { Bookmark, CalendarDays, Info, MessageSquarePlus, Plane, Ship, TrainFront, Truck } from 'lucide-react'
import { useId, useMemo, type MouseEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { Flag } from '@/components/ui/misc'
import { useI18n } from '@/i18n/I18nProvider'
import type { TransportMode } from '@/services/dutyCalculator'
import { AdditionalDuties } from './AdditionalDuties'
import { ExclusionCodes } from './ExclusionCodes'
import { HtsSearchInput } from './HtsSearchInput'
import type { DutyFormApi } from './useDutyForm'
import s from './calculator.module.css'

// Common origins for this customer base (old portal: mainly China / Asia imports).
const ORIGINS = ['CN', 'VN', 'IN', 'MX', 'KR', 'TW', 'JP', 'TH', 'MY', 'ID', 'BD', 'KH', 'TR', 'DE', 'IT', 'CA', 'US']
const MODES: { id: TransportMode; icon: typeof Ship }[] = [
  { id: 'ocean', icon: Ship },
  { id: 'air', icon: Plane },
  { id: 'truck', icon: Truck },
  { id: 'rail', icon: TrainFront },
]

const openPicker = (e: MouseEvent<HTMLInputElement>) => {
  try {
    e.currentTarget.showPicker?.()
  } catch {
    // not supported / not user-activated — native typing still works
  }
}

export function CalculatorCard({ api, initialQuery, onSave, onAsk, onCalculate }: {
  api: DutyFormApi
  initialQuery?: string
  onSave: () => void
  onAsk: () => void
  onCalculate: () => void
}) {
  const { t, lang } = useI18n()
  const ids = { product: useId(), value: useId(), origin: useId(), mode: useId(), entry: useId(), lading: useId(), dates: useId() }
  const { form, set, errors } = api
  const ModeIcon = MODES.find((m) => m.id === form.mode)?.icon ?? Ship

  const originOptions = useMemo(() => {
    let dn: Intl.DisplayNames | undefined
    try {
      dn = new Intl.DisplayNames([lang], { type: 'region' })
    } catch {
      dn = undefined
    }
    return ORIGINS.map((c) => ({ value: c, label: `${dn?.of(c) ?? c} (${c})` }))
  }, [lang])

  return (
    <Card className={s.card}>
      <header className={s.head}>
        <div className={s.titleRow}>
          <h1 className={s.title}>{t('hts.hero.title')}</h1>
          <button type="button" className={s.askLink} onClick={onAsk}>
            <MessageSquarePlus size={14} aria-hidden />
            <span className={s.askLead}>{t('hts.actions.askLead')}</span> {t('hts.actions.ask')}
          </button>
        </div>
        <p className={s.subtitle}>{t('hts.hero.subtitle')}</p>
      </header>

      <Field label={t('hts.calc.product')} info={t('hts.calc.productInfo')} htmlFor={ids.product} error={errors.item && t(errors.item)} className={s.productField}>
        <HtsSearchInput key={api.resetKey} id={ids.product} value={form.item} onChange={api.setItem} initialQuery={api.resetKey === 0 ? initialQuery : undefined} invalid={!!errors.item} />
      </Field>

      <div className={s.grid2}>
        <Field label={t('hts.calc.value')} info={t('hts.calc.valueInfo')} htmlFor={ids.value} error={errors.value && t(errors.value)}>
          <Input
            id={ids.value}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder={t('hts.calc.valuePlaceholder')}
            value={form.value}
            invalid={!!errors.value}
            onChange={(e) => set('value', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCalculate()}
            className="tnum"
          />
        </Field>
        <Field label={t('hts.calc.origin')} htmlFor={ids.origin}>
          <Select id={ids.origin} leading={<Flag code={form.origin} width={24} />} options={originOptions} value={form.origin} onChange={(e) => set('origin', e.target.value)} className={s.flagSelect} />
        </Field>
        <Field label={t('hts.calc.mode')} htmlFor={ids.mode}>
          <Select
            id={ids.mode}
            leading={<ModeIcon size={18} className={s.modeIcon} />}
            options={MODES.map((m) => ({ value: m.id, label: t(`common.mode.${m.id}`) }))}
            value={form.mode}
            onChange={(e) => set('mode', e.target.value as TransportMode)}
          />
        </Field>
        <Field label={t('hts.calc.entryDate')} htmlFor={ids.entry}>
          <Input id={ids.entry} type="date" className={s.date} leading={<CalendarDays size={17} />} value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} onClick={openPicker} aria-describedby={ids.dates} />
        </Field>
        <Field label={t('hts.calc.ladingDate')} htmlFor={ids.lading}>
          <Input id={ids.lading} type="date" className={s.date} leading={<CalendarDays size={17} />} value={form.ladingDate} onChange={(e) => set('ladingDate', e.target.value)} onClick={openPicker} aria-describedby={ids.dates} />
        </Field>
        <p id={ids.dates} className={`${s.muted} ${s.datesHint}`}>
          <Info size={13} aria-hidden /> {t('hts.calc.datesHint')}
        </p>
      </div>

      {form.item && <AdditionalDuties items={form.item.additionalDuties} selected={form.selectedAdditional} onToggle={api.toggleAdditional} />}

      <ExclusionCodes items={form.exclusions} onAdd={api.addExclusion} onToggle={api.toggleExclusion} onRemove={api.removeExclusion} />

      <div className={s.actions}>
        <Button variant="secondary" size="lg" leading={<Bookmark size={18} />} onClick={onSave} className={s.saveBtn}>
          {t('hts.actions.save')}
        </Button>
        <Button variant="secondary" size="lg" onClick={api.reset} className={s.resetBtn}>
          {t('hts.actions.reset')}
        </Button>
        <Button size="lg" onClick={onCalculate} className={s.calcBtn}>
          {t('hts.actions.calculate')}
        </Button>
      </div>
    </Card>
  )
}
