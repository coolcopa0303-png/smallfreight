'use client'

import { List, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Select } from '@/components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import type { QuoteResult, RateOption } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { CompactRateCard } from './CompactRateCard'
import { RateDetailsDrawer } from './RateDetailsDrawer'
import { RequestRateModal, SelectedQuoteModal } from './RateModals'
import { sortRates, type QuoteKind, type QuoteStatus, type SortKey, type SummaryRow } from './quoteUtils'
import s from './rates.module.css'

/** "Available Rates" section — cards, never a table (spec §7.4 / §8.3 / §20). */
export function AvailableRates({ kind, status, result, error, onRetry, summary, accessorials = [] }: {
  kind: QuoteKind
  status: QuoteStatus
  result?: QuoteResult
  error?: string
  onRetry: () => void
  summary: SummaryRow[]
  accessorials?: string[]
}) {
  const { t } = useI18n()
  const toast = useToast()
  const [sort, setSort] = useState<SortKey>('price')
  const [selected, setSelected] = useState<{ quotation?: string; id: string }>()
  const [details, setDetails] = useState<RateOption>()
  const [request, setRequest] = useState<RateOption>()
  const [confirm, setConfirm] = useState<RateOption>()

  const rates = useMemo(() => (result ? sortRates(result.rates, sort) : []), [result, sort])
  const available = rates.filter((r) => r.available).length
  // Selection belongs to one quotation; a new quote resets it without an effect.
  const selectedId = selected && selected.quotation === result?.quotationId ? selected.id : undefined

  const select = (r: RateOption) => {
    setSelected({ quotation: result?.quotationId, id: r.id })
    setDetails(undefined)
    setConfirm(r)
    toast(t('quotes.selected.toast', { carrier: r.carrierName }))
  }

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'price', label: t(`quotes.rates.sort.price${kind === 'ltl' ? 'Ltl' : 'Dray'}`) },
    { value: 'transit', label: t('quotes.rates.sort.transit') },
    { value: 'carrier', label: t('quotes.rates.sort.carrier') },
  ]
  const Icon = kind === 'ltl' ? List : Truck
  const title = kind === 'drayage' && status === 'done' ? t('quotes.rates.titleCount', { count: rates.length }) : t('quotes.rates.title')
  const sub =
    kind === 'ltl'
      ? status === 'done'
        ? t(available === 1 ? 'quotes.rates.foundOne' : 'quotes.rates.found', { count: available })
        : t('quotes.rates.subLtl')
      : t('quotes.rates.subDray')

  return (
    <section className={s.section} aria-labelledby={`${kind}-rates-title`} aria-busy={status === 'loading' || undefined}>
      <header className={s.head}>
        <span className={kind === 'ltl' ? s.headIconBox : s.headIcon} aria-hidden>
          <Icon size={kind === 'ltl' ? 22 : 30} strokeWidth={kind === 'ltl' ? 2 : 1.6} />
        </span>
        <div className={s.headText}>
          <h2 id={`${kind}-rates-title`} className={s.title}>{title}</h2>
          <p className={s.sub} aria-live="polite">{sub}</p>
        </div>
        {status === 'done' && rates.length > 1 && (
          <label className={s.sort}>
            <span>{t('quotes.rates.sortBy')}</span>
            <Select className={s.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} options={sortOptions} />
          </label>
        )}
      </header>

      {status === 'idle' && (
        <div className={`${s.empty} ${s.emptyInline}`}>
          <EmptyState icon={<Icon size={22} />} title={t('quotes.rates.emptyTitle')} body={t(`quotes.rates.emptyBody${kind === 'ltl' ? 'Ltl' : 'Dray'}`)} />
        </div>
      )}
      {status === 'loading' && (
        <div className={s.miniGrid}>
          {Array.from({ length: 6 }, (_, i) => <MiniSkeleton key={i} />)}
        </div>
      )}
      {status === 'error' && (
        <div className={s.empty}>
          <ErrorState title={t('quotes.rates.errorTitle')} detail={error} onRetry={onRetry} />
        </div>
      )}
      {status === 'done' && !rates.length && (
        <div className={s.empty}>
          <EmptyState title={t('quotes.rates.noneTitle')} body={t('quotes.rates.noneBody')} />
        </div>
      )}
      {status === 'done' && rates.length > 0 && (
        // Compact cards, one row, for both LTL and drayage (user request: small cards like reference-v2 04).
        <div className={s.miniGrid}>
          {rates.map((r) => (
            <CompactRateCard key={r.id} rate={r} selected={r.id === selectedId} onSelect={() => select(r)} onDetails={() => setDetails(r)} onRequest={() => setRequest(r)} />
          ))}
        </div>
      )}

      <RateDetailsDrawer rate={details} kind={kind} quotationNumber={result?.quotationNumber} summary={summary} accessorials={accessorials} onClose={() => setDetails(undefined)} onSelect={select} />
      <SelectedQuoteModal rate={confirm} kind={kind} quotationNumber={result?.quotationNumber} onClose={() => setConfirm(undefined)} />
      <RequestRateModal rate={request} quotationNumber={result?.quotationNumber} summary={summary} onClose={() => setRequest(undefined)} />
    </section>
  )
}

function MiniSkeleton() {
  return (
    <div className={s.mini} aria-hidden>
      <Skeleton width="70%" height={30} />
      <Skeleton width="50%" height={26} style={{ marginTop: 14 }} />
      {[0, 1, 2].map((i) => <Skeleton key={i} width="65%" height={12} style={{ marginTop: 10 }} />)}
      <Skeleton height={40} radius={7} style={{ marginTop: 'auto' }} />
    </div>
  )
}
