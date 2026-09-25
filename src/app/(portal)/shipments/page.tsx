import { Suspense } from 'react'
import { ShipmentTracking } from '@/components/tracking/ShipmentTracking'

/** Shipment Tracking (spec §6, reference 02). useSearchParams lives below the Suspense boundary. */
export default function ShipmentsPage() {
  return (
    <Suspense>
      <ShipmentTracking />
    </Suspense>
  )
}
