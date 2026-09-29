'use client'

import type { Shipment } from '@/domain/types'
import { ContainerDatesCard } from './ContainerDatesCard'
import { DocumentsCard } from './DocumentsCard'
import { ShipmentDetailsCard } from './InfoCards'
import { MilestoneTimeline } from './MilestoneTimeline'
import { UpdatesCard } from './UpdatesCard'
import s from './detail.module.css'

/**
 * Shipment detail on one page (old booking drawer): progress, the fields the backend really returns,
 * per-container dates and documents on the left, the status update log on the right.
 */
export function DetailBody({ shipment }: { shipment: Shipment }) {
  return (
    <div className={s.body}>
      <MilestoneTimeline shipment={shipment} />
      <div className={s.bodyGrid}>
        <div className={s.bodyMain}>
          <ShipmentDetailsCard shipment={shipment} />
          <ContainerDatesCard shipment={shipment} />
          <DocumentsCard shipment={shipment} />
        </div>
        <UpdatesCard shipment={shipment} />
      </div>
    </div>
  )
}
