import { Suspense } from 'react'
import { MyInquiriesPage } from '@/components/pages/myInquiries/MyInquiriesPage'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyInquiriesPage />
    </Suspense>
  )
}
