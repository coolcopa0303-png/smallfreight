'use client'

import { Search, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { matchesSearch, tabCounts, type SearchField } from '@/adapters/shipmentAdapter'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/misc'
import { matchesTab, STATUS_TABS, type StatusTab } from '@/domain/statusMap'
import { useShipments } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { ShipmentRow, ShipmentRowSkeleton } from './ShipmentRow'
import s from './tracking.module.css'

const PAGE_SIZE = 15
const FIELDS: SearchField[] = ['all', 'bl', 'hbl', 'container', 'booking', 'po', 'reference']
const COLS = ['shipment', 'route', 'progress', 'status', 'eta', 'lastUpdate', 'actions'] as const

const asField = (v: string | null): SearchField => (FIELDS as string[]).includes(v ?? '') ? (v as SearchField) : 'all'
const asTab = (v: string | null): StatusTab => ((STATUS_TABS as readonly string[]).includes(v ?? '') ? (v as StatusTab) : 'all')

/** Replace query params in place (native history API integrates with useSearchParams). */
function patchUrl(patch: Record<string, string | undefined>) {
  const params = new URLSearchParams(window.location.search)
  for (const [k, v] of Object.entries(patch)) {
    if (v) params.set(k, v)
    else params.delete(k)
  }
  const qs = params.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

/** Shipment Tracking list (spec §6): search + status tabs synced to the URL, compact rows, 15 per page. */
export function ShipmentTracking() {
  const { t } = useI18n()
  const sp = useSearchParams()
  const urlQ = sp.get('q') ?? ''
  const field = asField(sp.get('field'))
  const tab = asTab(sp.get('tab'))
  const { data, error, isLoading, mutate } = useShipments()

  // Local draft so typing stays instant; the URL follows after a short pause.
  const [draft, setDraft] = useState(urlQ)
  const [seen, setSeen] = useState({ url: urlQ, pushed: urlQ })
  if (urlQ !== seen.url) {
    setSeen({ ...seen, url: urlQ })
    if (urlQ !== seen.pushed) setDraft(urlQ) // changed from outside (e.g. global header search)
  }
  useEffect(() => {
    if (draft === urlQ) return
    const id = setTimeout(() => {
      setSeen((p) => ({ ...p, pushed: draft }))
      patchUrl({ q: draft.trim() ? draft : undefined })
    }, 300)
    return () => clearTimeout(id)
  }, [draft, urlQ])

  const q = useDeferredValue(draft)
  const searched = useMemo(() => {
    if (!data) return []
    return data.filter((sh) => matchesSearch(sh, q, field)).sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''))
  }, [data, q, field])
  const counts = useMemo(() => tabCounts(searched), [searched])
  const rows = useMemo(() => searched.filter((sh) => matchesTab(sh.status, tab)), [searched, tab])

  const filterKey = `${q}|${field}|${tab}`
  const [pager, setPager] = useState({ key: filterKey, page: 0 })
  const page = pager.key === filterKey ? Math.min(pager.page, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1)) : 0
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const goPage = (p: number) => {
    setPager({ key: filterKey, page: p })
    document.getElementById('shipment-list')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const tabItems = STATUS_TABS.map((k) => ({
    key: k,
    label: data ? t('shipments.tracking.tab', { label: t(`status.tabs.${k}`), count: counts[k] }) : t(`status.tabs.${k}`),
  }))
  const clearSearch = () => {
    setDraft('')
    patchUrl({ q: undefined, field: undefined })
  }

  let body: React.ReactNode
  if (error && !data) body = <ErrorState title={t('shipments.tracking.error')} onRetry={() => void mutate()} />
  else if (isLoading || !data) body = <ol className={s.list}>{Array.from({ length: 8 }, (_, i) => <ShipmentRowSkeleton key={i} />)}</ol>
  else if (rows.length === 0)
    body = q.trim() ? (
      <EmptyState
        title={t('shipments.tracking.empty')}
        body={t('shipments.tracking.emptyHint')}
        action={<Button variant="secondary" size="sm" onClick={clearSearch}>{t('shipments.tracking.clearSearch')}</Button>}
      />
    ) : (
      <EmptyState title={t('shipments.tracking.emptyTab')} body={t('shipments.tracking.emptyTabHint')} />
    )
  else body = <ol className={s.list}>{pageRows.map((sh) => <ShipmentRow key={sh.id} sh={sh} />)}</ol>

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.titles}>
          <h1 className={s.title}>{t('shipments.tracking.title')}</h1>
          <p className={s.subtitle}>{t('shipments.tracking.subtitle')}</p>
        </div>
        <div role="search" className={s.searchBox}>
          <label htmlFor="tracking-search" className="sr-only">
            {t('shipments.tracking.searchLabel')}
          </label>
          <Input
            id="tracking-search"
            className={s.search}
            leading={<Search size={18} />}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClear={clearSearch}
            placeholder={t('shipments.tracking.searchPlaceholder')}
            autoComplete="off"
            spellCheck={false}
          />
          {field !== 'all' && (
            <button type="button" className={s.fieldChip} onClick={() => patchUrl({ field: undefined })} title={t('shipments.tracking.fieldAll')}>
              {t('shipments.tracking.fieldFilter', { field: t(`shipments.fields.${field}`) })}
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
      </header>

      <Tabs items={tabItems} value={tab} onChange={(k) => patchUrl({ tab: k === 'all' ? undefined : k })} variant="pill" label={t('shipments.tracking.tabsLabel')} className={s.tabs} />

      <div id="shipment-list" className={s.listWrap}>
        <div className={s.colHead} aria-hidden hidden={!!data && rows.length === 0}>
          {COLS.map((c) => (
            <span key={c} className={s[`h-${c}`]}>
              {t(`shipments.tracking.cols.${c}`)}
            </span>
          ))}
        </div>
        {body}
      </div>

      {data && rows.length > PAGE_SIZE && (
        <div className={s.footer}>
          <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={goPage} />
        </div>
      )}
    </div>
  )
}
