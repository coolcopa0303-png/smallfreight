'use client'

import { Check } from 'lucide-react'
import type { Milestone } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import s from './shipment.module.css'

/** Six-step tracking progress used in list rows (reference 02). Calm palette: reached steps are brand blue, including delivered shipments. */
export function ShipmentProgress({ milestones, delivered, compact }: { milestones: Milestone[]; delivered: boolean; compact?: boolean }) {
  const { t } = useI18n()
  const label = milestones.map((m) => `${t(`status.milestone.${m.key}`)}: ${m.state === 'upcoming' ? '—' : '✓'}`).join(', ')
  return (
    <ol className={[s.progress, compact && s.compact].filter(Boolean).join(' ')} data-delivered={delivered || undefined} aria-label={label}>
      {milestones.map((m, i) => {
        const reached = m.state !== 'upcoming'
        const next = milestones[i + 1]
        const linkDone = reached && !!next && next.state !== 'upcoming'
        return (
          <li key={m.key} className={s.step} data-link={linkDone ? 'done' : undefined}>
            <span className={s.node} data-state={m.state} aria-hidden>
              {reached && <Check size={11} strokeWidth={3.5} />}
            </span>
            <span className={s.stepLabel}>{t(`status.milestone.${m.key}`)}</span>
          </li>
        )
      })}
    </ol>
  )
}
