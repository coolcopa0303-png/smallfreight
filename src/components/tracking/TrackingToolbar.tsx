'use client'

import { LayoutList, RotateCcw, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { ColumnsMenu } from './ColumnsMenu'
import type { ColumnId } from './columns'
import s from './tracking.module.css'

export type TrackingView = 'cards' | 'table'

/** Filters + view switch under the status tabs (merged from the former My Shipments page). */
export function TrackingToolbar({ view, onView, from, to, onFrom, onTo, dirty, onReset, count, columns, onToggleColumn }: {
  view: TrackingView
  onView: (v: TrackingView) => void
  from: string
  to: string
  onFrom: (v: string) => void
  onTo: (v: string) => void
  dirty: boolean
  onReset: () => void
  count?: number
  columns: { id: ColumnId; visible: boolean }[]
  onToggleColumn: (id: ColumnId) => void
}) {
  const { t } = useI18n()
  return (
    <div className={s.toolbar}>
      <div className={s.filters}>
        <label className={s.dateField}>
          <span>{t('shipments.my.etaFrom')}</span>
          <Input type="date" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} aria-label={t('shipments.my.etaFrom')} />
        </label>
        <label className={s.dateField}>
          <span>{t('shipments.my.etaTo')}</span>
          <Input type="date" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} aria-label={t('shipments.my.etaTo')} />
        </label>
        {dirty && (
          <Button variant="ghost" size="sm" leading={<RotateCcw size={14} />} onClick={onReset}>
            {t('shipments.my.resetFilters')}
          </Button>
        )}
        {count !== undefined && <span className={`${s.count} tnum`}>{t('shipments.my.count', { count })}</span>}
      </div>
      <div className={s.viewActions}>
        {view === 'table' && <ColumnsMenu columns={columns} onToggle={onToggleColumn} />}
        <div className={s.viewSwitch} role="group" aria-label={t('shipments.tracking.viewLabel')}>
          <button type="button" aria-pressed={view === 'cards'} onClick={() => onView('cards')}>
            <LayoutList size={16} aria-hidden />
            {t('shipments.tracking.viewCards')}
          </button>
          <button type="button" aria-pressed={view === 'table'} onClick={() => onView('table')}>
            <Table2 size={16} aria-hidden />
            {t('shipments.tracking.viewTable')}
          </button>
        </div>
      </div>
    </div>
  )
}
