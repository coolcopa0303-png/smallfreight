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
import { ShipmentTable, type SortDir } from './ShipmentTable'
import { TrackingToolbar, type TrackingView } from './TrackingToolbar'
import { useColumnConfig } from './useColumnConfig'
import s from './tracking.module.css'

const PAGE_SIZE = { cards: 15, table: 20 } as const
const FIELDS: SearchField[] = ['all', 'bl', 'hbl', 'container', 'booking', 'po', 'reference']
const COLS = ['shipment', 'route', 'progress', 'status', 'eta', 'lastUpdate', 'actions'] as const

const asField = (v: string | null): SearchField => (FIELDS as string[]).includes(v ?? '') ? (v as SearchField) : 'all'
const asTab = (v: string | null): StatusTab => ((STATUS_TABS as readonly string[]).includes(v ?? '') ? (v as StatusTab) : 'all')
const asDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')

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

/**
 * Shipment Tracking (spec §6) — the single shipment list. Search, status tabs, ETA range and view are synced to the URL.
 * Card view: compact rows with route + progress. Table view (former "My Shipments"): every status column, column settings.
 */
export function ShipmentTracking() {
  const { t } = useI18n()
  const sp = useSearchParams()
  const urlQ = sp.get('q') ?? ''
  const field = asField(sp.get('field'))
  const tab = asTab(sp.get('tab'))
  const view: TrackingView = sp.get('view') === 'table' ? 'table' : 'cards'
  const from = asDate(sp.get('from'))
  const to = asDate(sp.get('to'))
  const { data, error, isLoading, mutate } = useShipments()
  const { columns, visible, toggle } = useColumnConfig()
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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
    return data.filter((sh) => {
      if (!matchesSearch(sh, q, field)) return false
      if (from && (!sh.eta || sh.eta < from)) return false
      if (to && (!sh.eta || sh.eta > to)) return false
      return true
    })
  }, [data, q, field, from, to])
  const counts = useMemo(() => tabCounts(searched), [searched])
  const rows = useMemo(() => {
    const list = searched.filter((sh) => matchesTab(sh.status, tab))
    if (view === 'cards') return list.sort((a, b) => (b.lastUpdated ?? '').localeCompare(a.lastUpdated ?? ''))
    // Table: by ETA; shipments without ETA always sink to the bottom.
    const dir = sortDir === 'asc' ? 1 : -1
    return list.sort((a, b) => (!a.eta ? 1 : !b.eta ? -1 : a.eta.localeCompare(b.eta) * dir))
  }, [searched, tab, view, sortDir])

  const size = PAGE_SIZE[view]
  const filterKey = `${q}|${field}|${tab}|${from}|${to}|${view}|${sortDir}`
  const [pager, setPager] = useState({ key: filterKey, page: 0 })
  const page = pager.key === filterKey ? Math.min(pager.page, Math.max(0, Math.ceil(rows.length / size) - 1)) : 0
  const pageRows = rows.slice(page * size, (page + 1) * size)
  const goPage = (p: number) => {
    setPager({ key: filterKey, page: p })
    const list = document.getElementById('shipment-list')
    if (!list) return
    // Desktop: the list scrolls inside the frozen layout (card list or table wrapper) — reset that scroller.
    for (const el of list.querySelectorAll<HTMLElement>(':scope > *, :scope > * > *')) el.scrollTop = 0
    // Mobile: the whole page scrolls.
    list.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const tabItems = STATUS_TABS.map((k) => ({
    key: k,
    label: data ? t('shipments.tracking.tab', { label: t(`status.tabs.${k}`), count: counts[k] }) : t(`status.tabs.${k}`),
  }))
  const clearSearch = () => {
    setDraft('')
    patchUrl({ q: undefined, field: undefined })
  }
  const dirty = !!(draft.trim() || field !== 'all' || tab !== 'all' || from || to)
  const resetFilters = () => {
    setDraft('')
    patchUrl({ q: undefined, field: undefined, tab: undefined, from: undefined, to: undefined })
  }

  let body: React.ReactNode
  if (error && !data) body = <ErrorState title={t('shipments.tracking.error')} onRetry={() => void mutate()} />
  else if (view === 'table' && (isLoading || !data || rows.length > 0))
    body = (
      <div className={s.tableCard}>
        <ShipmentTable rows={pageRows} columns={visible} loading={isLoading || !data} sortDir={sortDir} onSort={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} />
      </div>
    )
  else if (isLoading || !data) body = <ol className={s.list}>{Array.from({ length: 8 }, (_, i) => <ShipmentRowSkeleton key={i} />)}</ol>
  else if (rows.length === 0)
    body = dirty ? (
      <EmptyState
        title={t('shipments.tracking.empty')}
        body={t('shipments.tracking.emptyHint')}
        action={<Button variant="secondary" size="sm" onClick={resetFilters}>{t('shipments.my.resetFilters')}</Button>}
      />
    ) : (
      <EmptyState title={t('shipments.tracking.emptyTab')} body={t('shipments.tracking.emptyTabHint')} />
    )
  else body = <ol className={s.list}>{pageRows.map((sh) => <ShipmentRow key={sh.id} sh={sh} />)}</ol>

  return (
    // data-freeze-layout: the shell gives this page a fixed one-screen height; only the list scrolls (Excel-style freeze).
    <div className={s.page} data-freeze-layout>
      <header className={s.header}>
        <h1 className={s.title}>{t('shipments.tracking.title')}</h1>
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

      <TrackingToolbar
        view={view}
        onView={(v) => patchUrl({ view: v === 'table' ? 'table' : undefined })}
        from={from}
        to={to}
        onFrom={(v) => patchUrl({ from: v || undefined })}
        onTo={(v) => patchUrl({ to: v || undefined })}
        dirty={dirty}
        onReset={resetFilters}
        count={data ? rows.length : undefined}
        columns={columns}
        onToggleColumn={toggle}
      />

      <div id="shipment-list" className={s.listWrap} data-view={view}>
        {view === 'cards' && !(data && rows.length === 0) && (
          <div className={s.colHead} aria-hidden>
            {COLS.map((c) => (
              <span key={c} className={s[`h-${c}`]}>
                {t(`shipments.tracking.cols.${c}`)}
              </span>
            ))}
          </div>
        )}
        {body}
      </div>

      {data && rows.length > size && (
        <div className={s.footer}>
          <Pagination page={page} pageSize={size} total={rows.length} onPage={goPage} />
        </div>
      )}
    </div>
  )
}
