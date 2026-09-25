'use client'

import { Download, RotateCcw, Search } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { matchesSearch, tabCounts } from '@/adapters/shipmentAdapter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Toast'
import { Pagination } from '@/components/ui/misc'
import { matchesTab, STATUS_TABS, type StatusTab } from '@/domain/statusMap'
import { useBillingWindows, useShipments } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { exportShipments } from '@/services/shipments'
import { ColumnsMenu } from './ColumnsMenu'
import { ShipmentTable, type SortDir } from './ShipmentTable'
import { useColumnConfig } from './useColumnConfig'
import s from './myShipments.module.css'

const PAGE_SIZE = 20

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** My Shipments — the old Booking table with every field, filters, column settings and export. */
export function MyShipments() {
  const { t, lang } = useI18n()
  const toast = useToast()
  const windows = useBillingWindows()
  const { data, error, isLoading, mutate } = useShipments()
  const { columns, visible, toggle } = useColumnConfig()

  const [keyword, setKeyword] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [tab, setTab] = useState<StatusTab>('all')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [exporting, setExporting] = useState(false)
  const q = useDeferredValue(keyword)

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((sh) => {
      if (!matchesSearch(sh, q, 'all')) return false
      if (from && (!sh.eta || sh.eta < from)) return false
      if (to && (!sh.eta || sh.eta > to)) return false
      return true
    })
  }, [data, q, from, to])
  const counts = useMemo(() => tabCounts(filtered), [filtered])
  const rows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    // Shipments without ETA always sink to the bottom.
    return filtered
      .filter((sh) => matchesTab(sh.status, tab))
      .sort((a, b) => (!a.eta ? 1 : !b.eta ? -1 : a.eta.localeCompare(b.eta) * dir))
  }, [filtered, tab, sortDir])

  const filterKey = `${q}|${from}|${to}|${tab}|${sortDir}`
  const [pager, setPager] = useState({ key: filterKey, page: 0 })
  const page = pager.key === filterKey ? pager.page : 0
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const dirty = !!(keyword || from || to || tab !== 'all')

  const reset = () => {
    setKeyword('')
    setFrom('')
    setTo('')
    setTab('all')
  }

  const onExport = async () => {
    if (!windows) return
    if (!rows.length) {
      toast(t('shipments.my.exportNothing'), 'info')
      return
    }
    setExporting(true)
    try {
      const { blob, filename } = await exportShipments(windows, visible, lang, rows)
      download(blob, filename)
      toast(t('shipments.my.exportStarted'))
    } catch {
      toast(t('shipments.my.exportFailed'), 'error')
    } finally {
      setExporting(false)
    }
  }

  const tabItems = STATUS_TABS.map((k) => ({
    key: k,
    label: data ? t('shipments.tracking.tab', { label: t(`status.tabs.${k}`), count: counts[k] }) : t(`status.tabs.${k}`),
  }))

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>{t('shipments.my.title')}</h1>
          <p className={s.subtitle}>{t('shipments.my.subtitle')}</p>
        </div>
        <div className={s.actions}>
          <ColumnsMenu columns={columns} onToggle={toggle} />
          <Button leading={<Download size={16} />} onClick={onExport} loading={exporting} disabled={!data}>
            {exporting ? t('shipments.my.exporting') : t('shipments.my.export')}
          </Button>
        </div>
      </header>

      <Card padded={false} className={s.card}>
        <div className={s.filters}>
          <Field label={t('shipments.my.searchLabel')} htmlFor="my-kw" className={s.kw}>
            <Input id="my-kw" leading={<Search size={16} />} value={keyword} onChange={(e) => setKeyword(e.target.value)} onClear={() => setKeyword('')} placeholder={t('shipments.my.searchPlaceholder')} autoComplete="off" />
          </Field>
          <Field label={t('shipments.my.etaFrom')} htmlFor="my-from" className={s.date}>
            <Input id="my-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label={t('shipments.my.etaTo')} htmlFor="my-to" className={s.date}>
            <Input id="my-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </Field>
          {dirty && (
            <Button variant="ghost" leading={<RotateCcw size={15} />} onClick={reset} className={s.reset}>
              {t('shipments.my.resetFilters')}
            </Button>
          )}
          {data && <span className={`${s.count} tnum`}>{t('shipments.my.count', { count: rows.length })}</span>}
        </div>
        <Tabs items={tabItems} value={tab} onChange={setTab} label={t('shipments.my.tabsLabel')} className={s.tabs} />

        {error && !data ? (
          <ErrorState title={t('shipments.my.error')} onRetry={() => void mutate()} />
        ) : data && rows.length === 0 ? (
          <EmptyState title={t('shipments.my.empty')} body={t('shipments.my.emptyHint')} action={dirty ? <Button variant="secondary" size="sm" onClick={reset}>{t('shipments.my.resetFilters')}</Button> : undefined} />
        ) : (
          <ShipmentTable rows={pageRows} columns={visible} loading={isLoading || !data} sortDir={sortDir} onSort={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} />
        )}

        {data && rows.length > PAGE_SIZE && (
          <div className={s.footer}>
            <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={(p) => setPager({ key: filterKey, page: p })} />
          </div>
        )}
      </Card>
    </div>
  )
}
