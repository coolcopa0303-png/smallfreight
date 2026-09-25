'use client'

import { CircleCheckBig, Package, Timer, Truck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber, fmtPct } from '@/i18n/format'
import type { Kpis } from './compute'
import s from './analytics.module.css'

function Tile({ icon, tone, label, value, hint }: { icon: ReactNode; tone: 'blue' | 'orange' | 'green' | 'purple'; label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className={s.kpi}>
      <span className={`${s.kpiIcon} ${s[`kpi-${tone}`]}`} aria-hidden>
        {icon}
      </span>
      <div className={s.kpiBody}>
        <p className={s.kpiLabel}>{label}</p>
        <p className={`${s.kpiValue} tnum`}>{value}</p>
        {hint && <p className={s.kpiHint}>{hint}</p>}
      </div>
    </div>
  )
}

export function KpiTiles({ kpis }: { kpis: Kpis }) {
  const { t, lang } = useI18n()
  const share = (n: number) => fmtPct(kpis.total ? (n / kpis.total) * 100 : 0, 0)
  return (
    <div className={s.kpis}>
      <Tile icon={<Package size={20} />} tone="blue" label={t('analytics.kpi.total')} value={fmtNumber(kpis.total, lang)} hint={t('analytics.kpi.totalHint')} />
      <Tile
        icon={<Truck size={20} />}
        tone="orange"
        label={t('analytics.kpi.active')}
        value={fmtNumber(kpis.active, lang)}
        hint={t('analytics.kpi.shareOfAll', { pct: share(kpis.active) })}
      />
      <Tile
        icon={<CircleCheckBig size={20} />}
        tone="green"
        label={t('analytics.kpi.delivered')}
        value={fmtNumber(kpis.delivered, lang)}
        hint={t('analytics.kpi.deliveredHint', { completed: fmtNumber(kpis.completed, lang), pct: share(kpis.delivered) })}
      />
      <Tile
        icon={<Timer size={20} />}
        tone="purple"
        label={t('analytics.kpi.avgRelease')}
        value={
          kpis.avgDaysToRelease === undefined ? (
            '—'
          ) : (
            <>
              {fmtNumber(kpis.avgDaysToRelease, lang, 1)}
              <span className={s.kpiUnit}>{t('analytics.kpi.daysUnit')}</span>
            </>
          )
        }
        hint={kpis.releaseSample ? t('analytics.kpi.sample', { count: fmtNumber(kpis.releaseSample, lang) }) : t('analytics.kpi.noSample')}
      />
    </div>
  )
}
