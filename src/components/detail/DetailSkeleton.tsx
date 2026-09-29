'use client'

import { Skeleton } from '@/components/ui/States'
import { useI18n } from '@/i18n/I18nProvider'
import s from './detail.module.css'

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
      <div className={s.body}>
        <Skeleton height={125} radius={9} />
        <div className={s.bodyGrid}>
          <div className={s.bodyMain}>
            <Skeleton height={260} radius={9} />
            <Skeleton height={140} radius={9} />
          </div>
          <Skeleton height={420} radius={9} />
        </div>
      </div>
    </div>
  )
}
