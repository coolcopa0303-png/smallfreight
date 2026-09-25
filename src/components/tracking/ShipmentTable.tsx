'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { Skeleton } from '@/components/ui/States'
import type { Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { RENDER, type ColumnId } from './columns'
import s from './shipmentTable.module.css'

export type SortDir = 'asc' | 'desc'

/** Dense data table (old Booking page fields). Rows open the detail; the SM# link is the keyboard entry. */
export function ShipmentTable({ rows, columns, loading, sortDir, onSort }: {
  rows: Shipment[]
  columns: ColumnId[]
  loading: boolean
  sortDir: SortDir
  onSort: () => void
}) {
  const { t } = useI18n()
  const router = useRouter()
  const open = (e: MouseEvent, id: string) => {
    if ((e.target as HTMLElement).closest('a, button, [tabindex]')) return
    if (window.getSelection()?.toString()) return
    router.push(`/shipments/${id}`)
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className={s[`col-${c}`]} aria-sort={c === 'eta' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                {c === 'eta' ? (
                  <button type="button" className={s.sortBtn} onClick={onSort} title={t('shipments.my.sortEta')}>
                    {t('shipments.my.cols.eta')}
                    {sortDir === 'asc' ? <ArrowUp size={13} aria-hidden /> : <ArrowDown size={13} aria-hidden />}
                  </button>
                ) : (
                  t(`shipments.my.cols.${c}`)
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 10 }, (_, i) => (
                <tr key={i} aria-hidden>
                  {columns.map((c) => (
                    <td key={c}>
                      <Skeleton width="75%" height={12} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((sh) => (
                <tr key={sh.id} className={s.row} onClick={(e) => open(e, sh.id)}>
                  {columns.map((c) => (
                    <td key={c} className={s[`col-${c}`]} data-label={t(`shipments.my.cols.${c}`)}>
                      {c === 'displayId' ? (
                        <Link href={`/shipments/${sh.id}`} className={s.idLink}>
                          {RENDER.displayId(sh, t)}
                        </Link>
                      ) : (
                        RENDER[c](sh, t)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
