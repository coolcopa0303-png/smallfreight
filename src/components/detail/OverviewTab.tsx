'use client'

import type { Shipment } from '@/domain/types'
import { CurrentStatusCard } from './CurrentStatusCard'
import { CargoCard, ShipmentDetailsCard } from './InfoCards'
import { KeyDatesCard } from './KeyDatesCard'
import { MilestoneTimeline } from './MilestoneTimeline'
import { RoutePanel } from './RoutePanel'
import s from './overview.module.css'

export function OverviewTab({ shipment, onViewTracking }: { shipment: Shipment; onViewTracking: () => void }) {
  return (
    <div className={s.overview}>
      <div className={s.topGrid}>
        <RoutePanel shipment={shipment} />
        <CurrentStatusCard shipment={shipment} onViewTracking={onViewTracking} />
      </div>
      <MilestoneTimeline shipment={shipment} />
      <div className={s.infoGrid}>
        <ShipmentDetailsCard shipment={shipment} />
        <CargoCard shipment={shipment} />
        <KeyDatesCard shipment={shipment} />
      </div>
    </div>
  )
}
