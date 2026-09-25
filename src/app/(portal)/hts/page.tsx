import { Suspense } from 'react'
import { HtsPage } from '@/components/hts/HtsPage'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HtsPage />
    </Suspense>
  )
}
