'use client'

import { ExternalLink, FileText, FolderOpen } from 'lucide-react'
import useSWR from 'swr'
import { Skeleton, EmptyState, ErrorState } from '@/components/ui/States'
import type { Shipment } from '@/domain/types'
import { useBillingWindows } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate } from '@/i18n/format'
import { fetchShipmentFiles } from '@/services/shipments'
import { InfoCard } from './InfoCards'
import s from './tabs.module.css'

export function DocumentsTab({ shipment }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  const windows = useBillingWindows()
  const { data, error, isLoading, mutate } = useSWR(windows ? ['cargo-files', shipment.id, JSON.stringify(windows)] : null, () =>
    fetchShipmentFiles(shipment.id, windows!),
  )

  let body
  if (error) body = <ErrorState title={t('detail.documents.error')} onRetry={() => void mutate()} />
  else if (isLoading || !data)
    body = (
      <div className={s.docList}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={52} radius={8} />
        ))}
      </div>
    )
  else if (data.length === 0)
    body = <EmptyState icon={<FolderOpen size={22} />} title={t('detail.documents.empty')} body={t('detail.documents.emptyBody')} />
  else
    body = (
      <ul className={s.docList}>
        {data.map((d) => (
          <li key={d.id} className={s.doc}>
            <span className={s.docIcon} aria-hidden>
              <FileText size={18} />
            </span>
            <div className={s.docText}>
              <p className={s.docName}>{d.name}</p>
              {d.uploadedAt && <p className={s.docMeta}>{t('detail.documents.uploaded', { date: fmtDate(d.uploadedAt, lang) })}</p>}
            </div>
            {d.url && (
              <a href={d.url} target="_blank" rel="noopener noreferrer" className={s.docLink}>
                {t('detail.documents.open')}
                <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
    )

  return (
    <InfoCard id="detail-docs" icon={<FolderOpen size={20} />} title={t('detail.documents.title')}>
      {body}
    </InfoCard>
  )
}
