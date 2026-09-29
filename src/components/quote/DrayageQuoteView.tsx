'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { useI18n } from '@/i18n/I18nProvider'
import { CONTAINER_TYPES, fetchDrayagePorts, requestDrayageQuote, type ContainerTypeId, type DrayageQuoteInput } from '@/services/quotes'
import { DrayageQuoteForm } from './DrayageQuoteForm'
import { DrayageQuoteResult } from './DrayageQuoteResult'
import s from './page.module.css'
import { QuoteResultHeader } from './QuoteResultHeader'
import { useQuoteRequest } from './useQuoteRequest'

/**
 * /quotes/drayage — like the old FCL quote pages: the request form is one screen, the result another.
 * The form stays mounted (hidden) while the result shows, so "Edit Request" returns with the values kept.
 */
export function DrayageQuoteView() {
  const { t } = useI18n()
  const params = useSearchParams()
  const ports = useSWR('drayage-ports', fetchDrayagePorts, { revalidateOnFocus: false })
  const quote = useQuoteRequest(requestDrayageQuote)
  const [screen, setScreen] = useState<'form' | 'result'>('form')
  // Bumped by "New Quote" to remount a blank form.
  const [formKey, setFormKey] = useState(0)

  const containerParam = params.get('container')
  const initialContainer = CONTAINER_TYPES.find((c) => c.id === containerParam)?.id as ContainerTypeId | undefined

  const show = (next: 'form' | 'result') => {
    setScreen(next)
    window.scrollTo({ top: 0 })
  }
  const submit = (input: DrayageQuoteInput) => {
    show('result')
    void quote.run(input, [])
  }
  const newQuote = () => {
    setFormKey((k) => k + 1)
    show('form')
  }

  return (
    <div className={`${s.page} ${s.pageDray}`}>
      <div className={s.page} style={screen === 'form' ? undefined : { display: 'none' }}>
        <header className={s.pageHead}>
          <h1 className={s.pageTitle}>{t('quotes.dray.title')}</h1>
          <p className={s.pageSub}>{t('quotes.dray.subtitle')}</p>
        </header>
        <DrayageQuoteForm
          key={formKey}
          ports={ports.data}
          portsState={ports.error ? 'error' : ports.data ? 'ready' : 'loading'}
          onRetryPorts={() => void ports.mutate()}
          // Dashboard prefill applies to the first form only, not to "New Quote".
          initialPortId={formKey ? undefined : params.get('port') ?? undefined}
          initialZip={formKey ? undefined : params.get('zip')?.match(/\d{5}/)?.[0]}
          initialContainer={formKey ? undefined : initialContainer}
          loading={quote.status === 'loading'}
          onSubmit={submit}
        />
      </div>

      {screen === 'result' && quote.status !== 'idle' && (
        <>
          <QuoteResultHeader
            title={
              quote.status === 'done' && quote.result
                ? t('quotes.dray.resultTitle', { number: quote.result.quotationNumber })
                : t('quotes.dray.resultTitlePending')
            }
            onEdit={() => show('form')}
            onNewQuote={newQuote}
          />
          <DrayageQuoteResult status={quote.status} quote={quote.result} onRetry={quote.retry} />
        </>
      )}
    </div>
  )
}
