'use client'

import { useCallback, useRef, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { QuoteResult } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import type { QuoteStatus, SummaryRow } from './quoteUtils'

interface State<R> {
  status: QuoteStatus
  result?: R
  error?: string
  summary: SummaryRow[]
  accessorials: string[]
}

/** Runs a quote request, keeps the last input for "Try Again", toasts API errors (spec §4.7 / §19). */
export function useQuoteRequest<I, R = QuoteResult>(request: (input: I) => Promise<R>) {
  const { t } = useI18n()
  const toast = useToast()
  const [state, setState] = useState<State<R>>({ status: 'idle', summary: [], accessorials: [] })
  const last = useRef<{ input: I; summary: SummaryRow[]; accessorials: string[] } | null>(null)
  const seq = useRef(0)

  const run = useCallback(
    async (input: I, summary: SummaryRow[], accessorials: string[] = []) => {
      last.current = { input, summary, accessorials }
      const id = ++seq.current
      setState((s) => ({ ...s, status: 'loading', error: undefined, summary, accessorials }))
      try {
        const result = await request(input)
        if (id === seq.current) setState({ status: 'done', result, summary, accessorials })
      } catch (e) {
        if (id !== seq.current) return
        const message = e instanceof Error ? e.message : String(e)
        setState({ status: 'error', error: message, summary, accessorials })
        toast(t('common.toast.apiError', { message }), 'error')
      }
    },
    [request, t, toast],
  )

  const retry = useCallback(() => {
    if (last.current) void run(last.current.input, last.current.summary, last.current.accessorials)
  }, [run])

  return { ...state, run, retry }
}
