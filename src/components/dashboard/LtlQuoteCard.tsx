'use client'

import { Box, Truck, Weight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, ViewAllLink } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import s from './services.module.css'

/** Quick LTL form — hands the values to /quotes/ltl as query params (spec §5.3). */
export function LtlQuoteCard() {
  const { t } = useI18n()
  const router = useRouter()
  const id = useId()
  const [v, setV] = useState({ origin: '', destination: '', weight: '', dims: '' })
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    for (const [k, val] of Object.entries(v)) if (val.trim()) params.set(k, val.trim())
    const qs = params.toString()
    router.push(qs ? `/quotes/ltl?${qs}` : '/quotes/ltl')
  }

  return (
    <Card className={s.svc}>
      <CardHeader
        icon={<Truck size={28} strokeWidth={1.8} />}
        title={t('dashboard.ltl.title')}
        action={<ViewAllLink href="/my-inquiries?tab=ltl">{t('common.actions.viewAll')}</ViewAllLink>}
      />
      <form className={s.form} onSubmit={submit}>
        <div className={s.row}>
          <Field label={t('dashboard.ltl.origin')} htmlFor={`${id}-o`}>
            <Input id={`${id}-o`} className={s.ctl} value={v.origin} onChange={set('origin')} placeholder={t('dashboard.ltl.placePlaceholder')} autoComplete="off" />
          </Field>
          <Field label={t('dashboard.ltl.destination')} htmlFor={`${id}-d`}>
            <Input id={`${id}-d`} className={s.ctl} value={v.destination} onChange={set('destination')} placeholder={t('dashboard.ltl.placePlaceholder')} autoComplete="off" />
          </Field>
        </div>
        <fieldset className={s.group}>
          <legend className={s.legend}>{t('dashboard.ltl.details')}</legend>
          <div className={s.row}>
            <Input
              className={s.ctl}
              leading={<Weight size={15} />}
              addon={t('dashboard.ltl.weightUnit')}
              value={v.weight}
              onChange={set('weight')}
              placeholder={t('dashboard.ltl.weight')}
              aria-label={`${t('dashboard.ltl.weight')} (${t('dashboard.ltl.weightUnit')})`}
              inputMode="decimal"
            />
            <Input
              className={s.ctl}
              leading={<Box size={15} />}
              addon={t('dashboard.ltl.dimsUnit')}
              value={v.dims}
              onChange={set('dims')}
              placeholder={t('dashboard.ltl.dims')}
              aria-label={`${t('dashboard.ltl.dims')} (${t('dashboard.ltl.dimsUnit')})`}
            />
          </div>
        </fieldset>
        <Button type="submit" block className={s.cta}>
          {t('dashboard.ltl.submit')}
        </Button>
      </form>
    </Card>
  )
}
