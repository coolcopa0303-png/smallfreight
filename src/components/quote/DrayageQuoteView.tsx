'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useI18n } from '@/i18n/I18nProvider'
import { CONTAINER_TYPES, fetchDrayagePorts, requestDrayageQuote, type ContainerTypeId } from '@/services/quotes'
import { DrayageQuoteForm } from './DrayageQuoteForm'
import { DrayageQuoteResult } from './DrayageQuoteResult'
import s from './page.module.css'
import { useQuoteRequest } from './useQuoteRequest'

/** /quotes/drayage — old FCL quote page: request form, then SMALL FREIGHT's own rate (no other carriers). */
export function DrayageQuoteView() {
  const { t } = useI18n()
  const params = useSearchParams()
  const ports = useSWR('drayage-ports', fetchDrayagePorts, { revalidateOnFocus: false })
  const quote = useQuoteRequest(requestDrayageQuote)
  const resultRef = useRef<HTMLDivElement>(null)

  const containerParam = params.get('container')
  const initialContainer = CONTAINER_TYPES.find((c) => c.id === containerParam)?.id as ContainerTypeId | undefined

  useEffect(() => {
    if (quote.status === 'loading') resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [quote.status])

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
        initialPortId={params.get('port') ?? undefined}
        initialZip={params.get('zip')?.match(/\d{5}/)?.[0]}
        initialContainer={initialContainer}
        loading={quote.status === 'loading'}
        onSubmit={(input) => void quote.run(input, [])}
      />
      <div ref={resultRef}>
        {quote.status !== 'idle' && <DrayageQuoteResult status={quote.status} quote={quote.result} onRetry={quote.retry} />}
      </div>
    </div>
  )
}
