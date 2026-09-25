'use client'

import { Anchor, ArrowRightLeft, Clock, MapPin, Truck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import type { MapMarker } from '@/components/map/RouteMap'
import type { DrayagePort, Location } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import { lookupZip } from '@/services/geo'
import { CONTAINER_TYPES, checkDrayageDestination, fetchDrayagePorts, requestDrayageQuote, type ContainerTypeId } from '@/services/quotes'
import { AvailableRates } from './AvailableRates'
import { DrayageQuoteForm } from './DrayageQuoteForm'
import { daysLabel, escapeHtml, estimateTransit, formatLocation, shortTerminal, transitSpan } from './quoteUtils'
import { RouteDetails } from './RouteDetails'
import { RouteMapCard } from './RouteMapCard'
import { TerminalFees } from './TerminalFees'
import s from './page.module.css'
import r from './route.module.css'
import { useLocationField } from './useLocationField'
import { useQuoteRequest } from './useQuoteRequest'
import { useRoute } from './useRoute'

function matchPort(ports: DrayagePort[], q: string | null) {
  const k = q?.trim().toLowerCase()
  if (k) {
    const hit = ports.find((p) => p.id === q) ?? ports.find((p) => p.city.toLowerCase() === k || p.terminal.toLowerCase().includes(k))
    if (hit) return hit.id
  }
  return (ports.find((p) => p.city === 'Los Angeles') ?? ports[0])?.id
}

/** /quotes/drayage — reference 04 / spec §8. */
export function DrayageQuoteView() {
  const { t, lang } = useI18n()
  const params = useSearchParams()
  const ports = useSWR('drayage-ports', fetchDrayagePorts, { revalidateOnFocus: false })
  const [picked, setPicked] = useState<string>()
  const portId = picked ?? (ports.data ? matchPort(ports.data, params.get('port')) : undefined)
  const port = ports.data?.find((p) => p.id === portId)

  // Old portal: terminal-specific destination lookup first, generic ZIP geocode as fallback.
  const resolver = useCallback(
    async (text: string): Promise<Location | undefined> => {
      const zip = text.match(/\b\d{5}\b/)?.[0]
      if (!zip) return undefined
      const [loc, chk] = await Promise.all([lookupZip(zip), portId ? checkDrayageDestination(zip, portId).catch(() => undefined) : undefined])
      if (chk?.city && loc) return { ...loc, city: chk.city, state: chk.state }
      return loc
    },
    [portId],
  )
  const zip = useLocationField({ initial: params.get('zip'), resolver, format: (l) => l.zip })
  const dest = zip.location
  const { route, routing } = useRoute(port?.point, dest?.point)
  const quote = useQuoteRequest(requestDrayageQuote)

  const containerParam = params.get('container')?.toUpperCase()
  const initialContainer = (CONTAINER_TYPES.find((c) => c.id === containerParam)?.id ?? '40') as ContainerTypeId

  const markers = useMemo(() => {
    const m: MapMarker[] = []
    if (port?.point) m.push({ point: port.point, kind: 'port', label: escapeHtml(shortTerminal(port)), labelDirection: 'bottom' })
    if (dest?.point) m.push({ point: dest.point, kind: 'pinRed', label: `${escapeHtml(dest.zip)}<br>${escapeHtml(`${dest.city}, ${dest.state}`)}` })
    return m
  }, [port, dest])

  const span = transitSpan(quote.status === 'done' ? quote.result?.rates : undefined) ?? (route ? estimateTransit(route.miles, 'drayage') : undefined)
  const miles = route ? t(route.approximate ? 'quotes.route.milesApprox' : 'quotes.route.miles', { count: fmtNumber(route.miles, lang) }) : undefined

  return (
    <div className={`${s.page} ${s.pageDray}`}>
      <header className={s.pageHead}>
        <h1 className={s.pageTitle}>{t('quotes.dray.title')}</h1>
        <p className={s.pageSub}>{t('quotes.dray.subtitle')}</p>
      </header>
      <DrayageQuoteForm
        ports={ports.data}
        portsState={ports.error ? 'error' : ports.data ? 'ready' : 'loading'}
        onRetryPorts={() => void ports.mutate()}
        portId={portId}
        onPort={setPicked}
        zip={zip}
        initialContainer={initialContainer}
        loading={quote.status === 'loading'}
        onSubmit={(input, summary) => void quote.run(input, summary)}
      />
      <div className={`${r.row} ${r.rowDray}`}>
        <RouteMapCard
          className={r.mapTall}
          markers={markers}
          path={route?.path}
          routing={routing}
          hint={!port || !dest ? t('quotes.route.hintDray') : undefined}
          ariaLabel={port && dest ? t('quotes.route.mapLabel', { from: shortTerminal(port), to: formatLocation(dest) }) : t('quotes.route.mapEmpty')}
        />
        <RouteDetails
          stacked
          places={[
            { label: t('quotes.route.originPort'), labelIcon: <Anchor size={18} />, value: port ? shortTerminal(port) : undefined, sub: port?.location, loading: !ports.data && !ports.error },
            { label: t('quotes.route.deliveryDest'), labelIcon: <MapPin size={18} />, value: dest ? formatLocation(dest) : undefined, loading: zip.status === 'loading' },
          ]}
          metrics={[
            { icon: <ArrowRightLeft size={18} />, label: t('quotes.route.totalMiles'), value: miles, loading: routing },
            { icon: <Clock size={18} />, label: t('quotes.route.transit'), value: span ? daysLabel(t, span[0], span[1], true) : undefined, loading: routing },
            { icon: <Truck size={18} />, label: t('quotes.rates.serviceType'), value: t('quotes.service.portToDoor'), info: t('quotes.service.portToDoorInfo') },
          ]}
        >
          {port && <TerminalFees fees={port.fees} />}
        </RouteDetails>
      </div>
      <AvailableRates kind="drayage" status={quote.status} result={quote.result} error={quote.error} onRetry={quote.retry} summary={quote.summary} />
    </div>
  )
}
