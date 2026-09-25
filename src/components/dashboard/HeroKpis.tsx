'use client'

import { Anchor, BriefcaseBusiness, ClipboardCheck, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { countByStatus } from '@/adapters/shipmentAdapter'
import { Skeleton } from '@/components/ui/States'
import { useShipments } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import s from './hero.module.css'

/** Light count-up on first load only; skipped when the user prefers reduced motion (spec §15). */
function useCountUp(target: number | undefined) {
  const [value, setValue] = useState<number | null>(null)
  const played = useRef(false)
  useEffect(() => {
    if (target === undefined || played.current) return
    played.current = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700)
      setValue(p >= 1 ? null : Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return value ?? target
}

function Kpi({ icon, value, label, failed }: { icon: ReactNode; value: number | undefined; label: string; failed?: boolean }) {
  const { t, lang } = useI18n()
  const shown = useCountUp(value)
  return (
    <div className={s.kpi}>
      <span className={s.kpiIcon} aria-hidden>
        {icon}
      </span>
      <span className={s.kpiText}>
        {failed ? (
          <strong className={s.kpiValue}>{t('common.states.none')}</strong>
        ) : value === undefined ? (
          <Skeleton width={48} height={24} className={s.kpiSkel} />
        ) : (
          <strong className={`${s.kpiValue} tnum`}>{fmtNumber(shown, lang)}</strong>
        )}
        <span className={s.kpiLabel}>{label}</span>
      </span>
    </div>
  )
}

/** Restrained translucent KPI card on the right of the hero (spec §5.2). Counts come from the shipment list. */
export function HeroKpis() {
  const { t } = useI18n()
  const { data, error } = useShipments()
  const c = useMemo(() => (data ? countByStatus(data) : undefined), [data])
  const f = !!error && !c
  return (
    <section className={s.glass} aria-label={t('dashboard.kpi.label')} aria-busy={!c || undefined}>
      <Kpi icon={<BriefcaseBusiness size={26} strokeWidth={1.6} />} value={c?.active} label={t('dashboard.kpi.active')} failed={f} />
      <Kpi icon={<Truck size={26} strokeWidth={1.6} />} value={c && c.inTransit + c.outForDelivery} label={t('dashboard.kpi.inTransit')} failed={f} />
      <Kpi icon={<Anchor size={26} strokeWidth={1.6} />} value={c?.atPort} label={t('dashboard.kpi.atPort')} failed={f} />
      <Kpi icon={<ClipboardCheck size={26} strokeWidth={1.6} />} value={c?.delivered} label={t('dashboard.kpi.delivered')} failed={f} />
    </section>
  )
}
