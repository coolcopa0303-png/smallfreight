'use client'

import { ArrowRight, ChevronRight, FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate } from '@/i18n/format'
import { fetchQuoteHistory, type QuoteHistoryItem } from '@/services/quotes'
import { QuoteDrawer } from './QuoteDrawer'
import s from './inquiries.module.css'

/** LTL (type LTL) or drayage (type FTL) quote history — the old portal's quote lists. */
export function QuotesTab({ type }: { type: 'LTL' | 'FTL' }) {
  const { t, lang } = useI18n()
  const [text, setText] = useState('')
  const [open, setOpen] = useState<QuoteHistoryItem | null>(null)
  const { data, error, isLoading, mutate } = useSWR(['quote-history', type], () => fetchQuoteHistory(type))
  const isLtl = type === 'LTL'

  // The summary endpoint has no keyword filter, so search client-side.
  const q = text.trim().toLowerCase()
  const rows = useMemo(
    () => (data ?? []).filter((r) => !q || [r.number, r.origin, r.destination].some((v) => v.toLowerCase().includes(q))).sort((a, b) => b.shippingDate.localeCompare(a.shippingDate)),
    [data, q],
  )

  if (error) return <ErrorState title={t('inquiries.quotes.errorTitle')} detail={(error as Error).message} onRetry={() => mutate()} />

  if (!isLoading && data && data.length === 0)
    return (
      <EmptyState
        icon={<FileText size={22} />}
        title={t(isLtl ? 'inquiries.quotes.emptyLtlTitle' : 'inquiries.quotes.emptyDrayageTitle')}
        body={t(isLtl ? 'inquiries.quotes.emptyLtlBody' : 'inquiries.quotes.emptyDrayageBody')}
        action={
          <ButtonLink href={isLtl ? '/quotes/ltl' : '/quotes/drayage'} trailing={<ArrowRight size={16} />}>
            {t(isLtl ? 'inquiries.quotes.emptyLtlCta' : 'inquiries.quotes.emptyDrayageCta')}
          </ButtonLink>
        }
      />
    )

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <Input className={s.search} leading={<Search size={17} />} value={text} placeholder={t('inquiries.quotes.search')} aria-label={t('inquiries.quotes.search')} onChange={(e) => setText(e.target.value)} onClear={() => setText('')} />
        <ButtonLink className={s.toolbarEnd} href={isLtl ? '/quotes/ltl' : '/quotes/drayage'} variant="secondary">
          {t(isLtl ? 'inquiries.quotes.emptyLtlCta' : 'inquiries.quotes.emptyDrayageCta')}
        </ButtonLink>
      </div>
      {isLoading || !data ? (
        <ul className={s.list} aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className={s.rowSkeleton}>
              <Skeleton width="30%" height={16} />
              <Skeleton width="55%" height={12} />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <EmptyState title={t('inquiries.quotes.noResultsTitle', { query: text.trim() })} body={t('inquiries.quotes.noResultsBody')} />
      ) : (
        <ul className={s.list}>
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" className={s.row} onClick={() => setOpen(r)} aria-label={t('inquiries.quotes.open', { number: r.number })}>
                <span className={s.rowMain}>
                  <span className={s.rowTitle}>
                    <span className="mono">{r.number}</span>
                  </span>
                  <span className={s.route}>
                    <span>{r.origin || '—'}</span>
                    <ArrowRight size={14} aria-hidden />
                    <span>{r.destination || '—'}</span>
                  </span>
                </span>
                <span className={s.rowSide}>
                  <span className={s.rowSub}>{t('inquiries.quotes.date')}</span>
                  <span className="tnum">{fmtDate(r.shippingDate, lang)}</span>
                </span>
                <ChevronRight size={18} className={s.chev} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <QuoteDrawer
          item={open}
          onClose={() => setOpen(null)}
          onHidden={() => {
            setOpen(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
