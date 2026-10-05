'use client'

import { Compass } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { useI18n } from '@/i18n/I18nProvider'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div style={{ minHeight: 'calc(100vh / var(--ui-zoom))', display: 'grid', placeItems: 'center', padding: 24 }}>
      <EmptyState
        icon={<Compass size={22} />}
        title={t('common.notFound.title')}
        body={t('common.notFound.body')}
        action={<ButtonLink href="/dashboard">{t('nav.dashboard')}</ButtonLink>}
      />
    </div>
  )
}
