import { Suspense } from 'react'
import { LtlQuoteView } from '@/components/quote/LtlQuoteView'
import { QuotePageFallback } from '@/components/quote/QuotePageFallback'

// useSearchParams (dashboard prefill) must sit inside a Suspense boundary.
export default function LtlQuotePage() {
  return (
    <Suspense fallback={<QuotePageFallback />}>
      <LtlQuoteView />
    </Suspense>
  )
}
