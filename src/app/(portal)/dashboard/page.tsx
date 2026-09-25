import { Announcements } from '@/components/dashboard/Announcements'
import { DrayageQuoteCard } from '@/components/dashboard/DrayageQuoteCard'
import { HtsCard } from '@/components/dashboard/HtsCard'
import { LtlQuoteCard } from '@/components/dashboard/LtlQuoteCard'
import { RecentShipments } from '@/components/dashboard/RecentShipments'
import { ShipmentOverview } from '@/components/dashboard/ShipmentOverview'
import { TrackHero } from '@/components/dashboard/TrackHero'
import s from '@/components/dashboard/dashboard.module.css'

/** Service hub + shipment overview (spec §5, reference 01). */
export default function DashboardPage() {
  return (
    <div className={s.page}>
      <TrackHero />
      <div className={s.services}>
        <LtlQuoteCard />
        <DrayageQuoteCard />
        <HtsCard />
      </div>
      <div className={s.bottom}>
        <RecentShipments />
        <div className={s.side}>
          <ShipmentOverview />
          <Announcements />
        </div>
      </div>
    </div>
  )
}
