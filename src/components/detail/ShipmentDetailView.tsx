'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { useShipment } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { DetailBody } from './DetailBody'
import { DetailHeader } from './DetailHeader'
import { DetailSkeleton } from './DetailSkeleton'
import s from './detail.module.css'

export function ShipmentDetailView({ id }: { id: string }) {
  const { t } = useI18n()
  const { shipment, isLoading, error, mutate } = useShipment(id)

  if (isLoading && !shipment) return <DetailSkeleton />

  if (error && !shipment) {
    return (
      <div className={s.page}>
        <BackLink />
        <div className={s.stateCard}>
          <ErrorState title={t('detail.error')} onRetry={mutate} />
        </div>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className={s.page}>
        <BackLink />
        <div className={s.stateCard}>
          <EmptyState
            title={t('detail.notFound.title')}
            body={t('detail.notFound.body', { id })}
            action={
              <ButtonLink href="/shipments" variant="secondary" size="sm" leading={<ArrowLeft size={16} />}>
                {t('detail.back')}
              </ButtonLink>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <BackLink />
      <DetailHeader shipment={shipment} />
      <DetailBody shipment={shipment} />
    </div>
  )
}

function BackLink() {
  const { t } = useI18n()
  return (
    <Link href="/shipments" className={s.back}>
      <ArrowLeft size={18} aria-hidden />
      {t('detail.back')}
    </Link>
  )
}
