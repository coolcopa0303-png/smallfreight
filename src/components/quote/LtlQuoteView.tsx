'use client'

import { ArrowRightLeft, Clock, MapPin, Truck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import type { MapMarker } from '@/components/map/RouteMap'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import { requestLtlQuote } from '@/services/quotes'
import { AvailableRates } from './AvailableRates'
import { LtlQuoteForm } from './LtlQuoteForm'
import { cityState, daysLabel, escapeHtml, estimateTransit, formatLocation, transitSpan } from './quoteUtils'
import { RouteDetails } from './RouteDetails'
import { RouteMapCard } from './RouteMapCard'
import s from './page.module.css'
import r from './route.module.css'
import { useLocationField } from './useLocationField'
import { useQuoteRequest } from './useQuoteRequest'
import { useRoute } from './useRoute'

/** /quotes/ltl — reference 03 / spec §7. */
export function LtlQuoteView() {
  const { t, lang } = useI18n()
  const params = useSearchParams()
  const origin = useLocationField({ initial: params.get('origin') })
  const destination = useLocationField({ initial: params.get('destination') })
  const o = origin.location
  const d = destination.location
  const { route, routing } = useRoute(o?.point, d?.point)
  const quote = useQuoteRequest(requestLtlQuote)

  const markers = useMemo(() => {
    const m: MapMarker[] = []
    if (o?.point) m.push({ point: o.point, kind: 'pinBlue', label: escapeHtml(cityState(o)) })
    if (d?.point) m.push({ point: d.point, kind: 'pinRed', label: escapeHtml(cityState(d)) })
    return m
  }, [o, d])

  const span = transitSpan(quote.status === 'done' ? quote.result?.rates : undefined) ?? (route ? estimateTransit(route.miles, 'ltl') : undefined)
  const miles = route ? t(route.approximate ? 'quotes.route.milesApprox' : 'quotes.route.miles', { count: fmtNumber(route.miles, lang) }) : undefined

  return (
    <div className={s.page}>
      <header className={s.pageHead}>
        <h1 className={s.pageTitle}>{t('quotes.ltl.title')}</h1>
        <p className={s.pageSub}>{t('quotes.ltl.subtitle')}</p>
      </header>
      <LtlQuoteForm
        origin={origin}
        destination={destination}
        initial={{ weight: params.get('weight'), dims: params.get('dims'), pieces: params.get('pieces') }}
        loading={quote.status === 'loading'}
        onSubmit={(input, summary, acc) => void quote.run(input, summary, acc)}
      />
      <div className={r.row}>
        <RouteMapCard
          markers={markers}
          path={route?.path}
          routing={routing}
          hint={!o || !d ? t('quotes.route.hintLtl') : undefined}
          ariaLabel={o && d ? t('quotes.route.mapLabel', { from: cityState(o), to: cityState(d) }) : t('quotes.route.mapEmpty')}
        />
        <RouteDetails
          places={[
            { label: t('quotes.form.origin'), labelIcon: <MapPin size={18} />, value: o ? formatLocation(o) : undefined, loading: origin.status === 'loading' },
            { label: t('quotes.form.destination'), labelIcon: <MapPin size={18} />, value: d ? formatLocation(d) : undefined, loading: destination.status === 'loading' },
          ]}
          metrics={[
            { icon: <ArrowRightLeft size={18} />, label: t('quotes.route.totalMiles'), value: miles, loading: routing },
            { icon: <Clock size={18} />, label: t('quotes.route.transit'), value: span ? daysLabel(t, span[0], span[1], true) : undefined, loading: routing },
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
      />
    </div>
  )
}
