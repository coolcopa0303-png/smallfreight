import { Skeleton } from '@/components/ui/States'
import s from './page.module.css'

/** Suspense fallback while search params resolve (client-rendered part of the page). */
export function QuotePageFallback() {
  return (
    <div className={s.fallback} aria-busy="true">
      <Skeleton height={120} radius={10} />
      <Skeleton height={190} radius={9} />
      <Skeleton height={214} radius={9} />
    </div>
  )
}
