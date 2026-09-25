'use client'

import { Skeleton } from '@/components/ui/States'
import { useI18n } from '@/i18n/I18nProvider'
import s from './detail.module.css'
import o from './overview.module.css'

export function DetailSkeleton() {
  const { t } = useI18n()
  return (
    <div className={s.page} aria-busy="true" aria-label={t('common.states.loading')}>
      <Skeleton width={190} height={18} />
      <div className={s.header}>
        <div className={s.headMain}>
          <Skeleton width={320} height={40} style={{ margin: '12px 0 10px' }} />
          <Skeleton width={560} height={16} style={{ maxWidth: '100%' }} />
        </div>
      </div>
      <Skeleton height={40} style={{ margin: '14px 0' }} />
      <div className={o.overview}>
        <div className={o.topGrid}>
          <Skeleton height={310} radius={9} />
          <Skeleton height={310} radius={9} />
        </div>
        <Skeleton height={125} radius={9} />
        <div className={o.infoGrid}>
          <Skeleton height={220} radius={9} />
          <Skeleton height={220} radius={9} />
          <Skeleton height={220} radius={9} />
        </div>
      </div>
    </div>
  )
}
