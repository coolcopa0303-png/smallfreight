'use client'

import { Container } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, ViewAllLink } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { CONTAINER_TYPES, fetchDrayagePorts, type ContainerTypeId } from '@/services/quotes'
import s from './services.module.css'

/** Quick drayage form — port list comes from the existing terminal API (spec §5.3). */
export function DrayageQuoteCard() {
  const { t } = useI18n()
  const router = useRouter()
  const id = useId()
  const { data: ports, error, isLoading } = useSWR('drayage-ports', fetchDrayagePorts, { revalidateOnFocus: false })
  const [port, setPort] = useState('')
  const [container, setContainer] = useState<ContainerTypeId>('40')
  const [pickup, setPickup] = useState('')
  const [zip, setZip] = useState('')

  const portOptions = useMemo(
    () => [
      { value: '', label: error ? t('dashboard.drayage.portsError') : isLoading ? t('common.states.loading') : t('dashboard.drayage.selectPort') },
      ...(ports ?? []).map((p) => ({ value: p.id, label: `${p.city}, ${p.state} – ${p.terminal}` })),
    ],
    [ports, error, isLoading, t],
  )
  const containerOptions = CONTAINER_TYPES.map((c) => ({ value: c.id, label: t(`dashboard.drayage.containers.${c.id}`) }))
  const onlyDigits = (v: string) => v.replace(/[^\d-]/g, '').slice(0, 10)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (port) params.set('port', port)
    params.set('container', container)
    if (zip) params.set('zip', zip)
    if (pickup) params.set('pickup', pickup)
    router.push(`/quotes/drayage?${params}`)
  }

  return (
    <Card className={s.svc}>
      <CardHeader
        icon={<Container size={28} strokeWidth={1.8} />}
        title={t('dashboard.drayage.title')}
        action={<ViewAllLink href="/my-inquiries?tab=drayage">{t('common.actions.viewAll')}</ViewAllLink>}
      />
      <form className={s.form} onSubmit={submit}>
        <div className={s.row}>
          <Field label={t('dashboard.drayage.port')} htmlFor={`${id}-p`}>
            <Select id={`${id}-p`} className={s.ctl} value={port} onChange={(e) => setPort(e.target.value)} options={portOptions} disabled={!!error} />
          </Field>
          <Field label={t('dashboard.drayage.container')} htmlFor={`${id}-c`}>
            <Select id={`${id}-c`} className={s.ctl} value={container} onChange={(e) => setContainer(e.target.value as ContainerTypeId)} options={containerOptions} />
          </Field>
        </div>
        <div className={s.row}>
          <Field label={t('dashboard.drayage.pickupZip')} htmlFor={`${id}-pz`}>
            <Input id={`${id}-pz`} className={s.ctl} value={pickup} onChange={(e) => setPickup(onlyDigits(e.target.value))} placeholder={t('dashboard.drayage.zipPlaceholder')} inputMode="numeric" autoComplete="postal-code" />
          </Field>
          <Field label={t('dashboard.drayage.deliveryZip')} htmlFor={`${id}-dz`}>
            <Input id={`${id}-dz`} className={s.ctl} value={zip} onChange={(e) => setZip(onlyDigits(e.target.value))} placeholder={t('dashboard.drayage.zipPlaceholder')} inputMode="numeric" autoComplete="postal-code" />
          </Field>
        </div>
        <Button type="submit" block className={s.cta}>
          {t('dashboard.drayage.submit')}
        </Button>
      </form>
    </Card>
  )
}
