'use client'

import type { Shipment } from '@/domain/types'
import { ContainerDatesCard } from './ContainerDatesCard'
import { ShipmentDetailsCard } from './InfoCards'
import { MilestoneTimeline } from './MilestoneTimeline'
import { RoutePanel } from './RoutePanel'
import { UpdatesCard } from './UpdatesCard'
import s from './detail.module.css'

/**
 * Shipment detail on one page (old booking drawer): progress; route map, the fields the backend really returns
 * and per-container dates on the left; the status update log on the right.
 */
export function DetailBody({ shipment }: { shipment: Shipment }) {
  return (
    <div className={s.body}>
      <MilestoneTimeline shipment={shipment} />
      <div className={s.bodyGrid}>
        <div className={s.bodyMain}>
          <RoutePanel shipment={shipment} />
          <ShipmentDetailsCard shipment={shipment} />
          <ContainerDatesCard shipment={shipment} />
        </div>
        <UpdatesCard shipment={shipment} />
      </div>
    </div>
  )
}
