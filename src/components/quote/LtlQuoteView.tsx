'use client'

import { ArrowRightLeft, CalendarDays, Clock, MapPin, Package, Scale, Truck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { MapMarker } from '@/components/map/RouteMap'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import { requestLtlQuote, type LtlQuoteInput } from '@/services/quotes'
import { AvailableRates } from './AvailableRates'
import { LtlQuoteForm } from './LtlQuoteForm'
import { cityState, daysLabel, escapeHtml, estimateTransit, formatLocation, transitSpan, type SummaryRow } from './quoteUtils'
import { QuoteResultHeader, QuoteSummary } from './QuoteResultHeader'
import { RouteDetails } from './RouteDetails'
import { RouteMapCard } from './RouteMapCard'
import s from './page.module.css'
import r from './route.module.css'
import { useLocationField } from './useLocationField'
import { useQuoteRequest } from './useQuoteRequest'
import { useRoute } from './useRoute'

const METRIC_ICON = { date: <CalendarDays size={18} />, weight: <Package size={18} />, class: <Scale size={18} /> }

/** Pickup date, cargo and freight class from the request, shown under the route metrics. */
function quoteMetrics(summary: SummaryRow[]) {
  const by = (icon: SummaryRow['icon']) => summary.find((r) => r.icon === icon)
  const date = by('date')
  const weight = by('weight')
  const dims = by('dims')
  const cls = by('class')
  return [
    date && { icon: METRIC_ICON.date, label: date.label, value: date.value },
    weight && { icon: METRIC_ICON.weight, label: weight.label, value: dims ? `${weight.value} · ${dims.value}` : weight.value },
    cls && { icon: METRIC_ICON.class, label: cls.label, value: cls.value },
  ].filter((m) => !!m)
}

/** /quotes/ltl — "New Quote" remounts a blank session; the dashboard prefill only seeds the first one. */
export function LtlQuoteView() {
  const [session, setSession] = useState(0)
  return <LtlQuoteSession key={session} prefill={session === 0} onNewQuote={() => setSession((n) => n + 1)} />
}

/**
 * Like the old LTL quote pages: the request form is one screen, the carrier rates another.
 * The form stays mounted (hidden) while the rates show, so "Edit Request" returns with the values kept.
 */
function LtlQuoteSession({ prefill, onNewQuote }: { prefill: boolean; onNewQuote: () => void }) {
  const { t, lang } = useI18n()
  const params = useSearchParams()
  const origin = useLocationField({ initial: prefill ? params.get('origin') : null })
  const destination = useLocationField({ initial: prefill ? params.get('destination') : null })
  const quote = useQuoteRequest(requestLtlQuote)
  const [screen, setScreen] = useState<'form' | 'result'>('form')
  // Route shown with the rates is the one that was quoted, not whatever the (hidden) form holds now.
  const [quoted, setQuoted] = useState<Pick<LtlQuoteInput, 'origin' | 'destination'>>()
  const qo = quoted?.origin
  const qd = quoted?.destination
  const { route, routing } = useRoute(qo?.point, qd?.point)

  const markers = useMemo(() => {
    const m: MapMarker[] = []
    if (qo?.point) m.push({ point: qo.point, kind: 'pinBlue', label: escapeHtml(cityState(qo)) })
    if (qd?.point) m.push({ point: qd.point, kind: 'pinRed', label: escapeHtml(cityState(qd)) })
    return m
  }, [qo, qd])

  const span = transitSpan(quote.status === 'done' ? quote.result?.rates : undefined) ?? (route ? estimateTransit(route.miles, 'ltl') : undefined)
  const miles = route ? t(route.approximate ? 'quotes.route.milesApprox' : 'quotes.route.miles', { count: fmtNumber(route.miles, lang) }) : undefined

  const show = (next: 'form' | 'result') => {
    setScreen(next)
    window.scrollTo({ top: 0 })
  }
  const submit = (input: LtlQuoteInput, summary: SummaryRow[], acc: string[]) => {
    setQuoted({ origin: input.origin, destination: input.destination })
    show('result')
    void quote.run(input, summary, acc)
  }

  return (
    <div className={s.page}>
      <div className={s.page} style={screen === 'form' ? undefined : { display: 'none' }}>
        <header className={s.pageHead}>
          <h1 className={s.pageTitle}>{t('quotes.ltl.title')}</h1>
          <p className={s.pageSub}>{t('quotes.ltl.subtitle')}</p>
        </header>
        <LtlQuoteForm
          origin={origin}
          destination={destination}
          initial={prefill ? { weight: params.get('weight'), dims: params.get('dims'), pieces: params.get('pieces') } : {}}
          loading={quote.status === 'loading'}
          onSubmit={submit}
        />
      </div>

      {screen === 'result' && quote.status !== 'idle' && (
        <div className={s.resultScreen}>
          <QuoteResultHeader
            title={
              quote.status === 'done' && quote.result?.quotationNumber
                ? t('quotes.ltl.resultTitle', { number: quote.result.quotationNumber })
                : t('quotes.ltl.resultTitlePending')
            }
            onEdit={() => show('form')}
            onNewQuote={onNewQuote}
          />
          <QuoteSummary rows={quote.summary} extra={quote.accessorials.length ? { label: t('quotes.more.accessorials'), value: quote.accessorials.join(', ') } : undefined} />
          <div className={`${r.row} ${r.rowGrow}`}>
            <RouteMapCard
              markers={markers}
              path={route?.path}
              routing={routing}
              padding={30}
              ariaLabel={qo && qd ? t('quotes.route.mapLabel', { from: cityState(qo), to: cityState(qd) }) : t('quotes.route.mapEmpty')}
            />
            <RouteDetails
              places={[
                { label: t('quotes.form.origin'), labelIcon: <MapPin size={18} />, value: qo ? formatLocation(qo) : undefined },
                { label: t('quotes.form.destination'), labelIcon: <MapPin size={18} />, value: qd ? formatLocation(qd) : undefined },
              ]}
              metrics={[
                { icon: <ArrowRightLeft size={18} />, label: t('quotes.route.totalMiles'), value: miles, loading: routing },
                { icon: <Clock size={18} />, label: t('quotes.route.transit'), value: span ? daysLabel(t, span[0], span[1], true) : undefined, loading: routing },
                // Repeat what was quoted so the panel reads as the full request next to the map.
                ...quoteMetrics(quote.summary),
                { icon: <Truck size={18} />, label: t('quotes.rates.serviceType'), value: t('quotes.service.standardLtl'), info: t('quotes.service.standardLtlInfo') },
              ]}
            />
          </div>
          <AvailableRates
            kind="ltl"
            status={quote.status}
            result={quote.result}
            error={quote.error}
            onRetry={quote.retry}
            summary={quote.summary}
            accessorials={quote.accessorials}
            grow
          />
        </div>
      )}
    </div>
  )
}
