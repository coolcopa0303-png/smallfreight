import { Suspense } from 'react'
import { DetailSkeleton } from '@/components/detail/DetailSkeleton'
import { ShipmentDetailView } from '@/components/detail/ShipmentDetailView'
import cargoes from '@/mocks/data/cargoes.json'

// Static export (demo hosting) must pre-render every detail page; server mode renders on demand.
export function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== '1') return []
  return (cargoes as { id: number }[]).map((c) => ({ id: String(c.id) }))
}

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ShipmentDetailView id={decodeURIComponent(id)} />
    </Suspense>
  )
}
