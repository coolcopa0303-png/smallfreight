import { Suspense } from 'react'
import { DrayageQuoteView } from '@/components/quote/DrayageQuoteView'
import { QuotePageFallback } from '@/components/quote/QuotePageFallback'

// useSearchParams (dashboard prefill) must sit inside a Suspense boundary.
export default function DrayageQuotePage() {
  return (
    <Suspense fallback={<QuotePageFallback />}>
      <DrayageQuoteView />
    </Suspense>
  )
}
