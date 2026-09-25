'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { useShipment } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { ContainersTab } from './ContainersTab'
import { DetailHeader } from './DetailHeader'
import { DetailSkeleton } from './DetailSkeleton'
import { DocumentsTab } from './DocumentsTab'
import { OverviewTab } from './OverviewTab'
import { SupportTab } from './SupportTab'
import { TrackingTab } from './TrackingTab'
import s from './detail.module.css'

const TABS = ['overview', 'tracking', 'documents', 'containers', 'charges', 'communications'] as const
type TabKey = (typeof TABS)[number]

export function ShipmentDetailView({ id }: { id: string }) {
  const { t } = useI18n()
  const { shipment, isLoading, error, mutate } = useShipment(id)
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const raw = params.get('tab')
  const tab: TabKey = (TABS as readonly string[]).includes(raw ?? '') ? (raw as TabKey) : 'overview'

  const setTab = useCallback(
    (k: TabKey) => {
      const next = new URLSearchParams(params.toString())
      if (k === 'overview') next.delete('tab')
      else next.set('tab', k)
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )

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
              <ButtonLink href="/my-shipments" variant="secondary" size="sm" leading={<ArrowLeft size={16} />}>
                {t('detail.back')}
              </ButtonLink>
            }
          />
        </div>
      </div>
    )
  }

  const items = TABS.map((k) => ({
    key: k,
    label: k === 'containers' ? t('detail.tabs.containers', { count: shipment.containers.length }) : t(`detail.tabs.${k}`),
  }))

  return (
    <div className={s.page}>
      <BackLink />
      <DetailHeader shipment={shipment} />
      <Tabs items={items} value={tab} onChange={setTab} variant="underline" label={t('detail.tabs.label')} className={s.tabs} />
      <div role="tabpanel" aria-label={t(`detail.tabs.${tab}`, { count: shipment.containers.length })} className={s.panel}>
        {tab === 'overview' && <OverviewTab shipment={shipment} onViewTracking={() => setTab('tracking')} />}
        {tab === 'tracking' && <TrackingTab shipment={shipment} />}
        {tab === 'documents' && <DocumentsTab shipment={shipment} />}
        {tab === 'containers' && <ContainersTab shipment={shipment} />}
        {tab === 'charges' && <SupportTab kind="charges" />}
        {tab === 'communications' && <SupportTab kind="communications" />}
      </div>
    </div>
  )
}

function BackLink() {
  const { t } = useI18n()
  return (
    <Link href="/my-shipments" className={s.back}>
      <ArrowLeft size={18} aria-hidden />
      {t('detail.back')}
    </Link>
  )
}
