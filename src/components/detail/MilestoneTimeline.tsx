'use client'

import { Anchor, Check, ClipboardCheck, Package, Ship, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'
import { MILESTONE_ORDER } from '@/domain/statusMap'
import type { MilestoneKey, Shipment } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtTime } from '@/i18n/format'
import { hasTime, milestoneLabel, modeLabel } from './helpers'
import s from './timeline.module.css'

const ICON: Record<MilestoneKey, LucideIcon> = {
  booked: ClipboardCheck,
  inTransit: Ship,
  atPort: Anchor,
  customs: ShieldCheck,
  outForDelivery: Truck,
  delivered: Package,
}

/** Horizontal milestone timeline: done = green check, current = blue node with mode icon, upcoming = grey outline. */
export function MilestoneTimeline({ shipment: sh }: { shipment: Shipment }) {
  const { t, lang } = useI18n()
  const byKey = new Map(sh.milestones.map((m) => [m.key, m]))
  const steps = MILESTONE_ORDER.map((key) => byKey.get(key) ?? { key, state: 'upcoming' as const })

  return (
    <section className={s.card} aria-label={t('detail.timeline.label')}>
      <ol className={s.track}>
        {steps.map((m, i) => {
          const next = steps[i + 1]
          // Connector colour follows the *next* node: green into done, blue into current, dotted grey into upcoming.
          const link = next ? next.state : undefined
          const Icon = m.key === 'inTransit' && sh.transport === 'truck' ? Truck : ICON[m.key]
          const stateText = t(`detail.timeline.state${m.state === 'done' ? 'Done' : m.state === 'current' ? 'Current' : 'Upcoming'}`)
          return (
            <li key={m.key} className={s.step} data-state={m.state} data-link={link}>
              <span className={s.node} aria-hidden>
                {m.state === 'done' ? <Check size={17} strokeWidth={3} /> : <Icon size={m.state === 'current' ? 20 : 16} strokeWidth={2} />}
              </span>
              <span className={s.label}>
                {milestoneLabel(sh, m.key, m.state, t)}
                <span className={s.srOnly}> ({stateText})</span>
              </span>
              {m.state === 'current' && m.key === 'inTransit' && <span className={s.sub}>{modeLabel(sh, t)}</span>}
              {m.date ? (
                <>
                  <span className={s.date}>{fmtDate(m.date, lang)}</span>
                  {m.estimated ? (
                    <span className={s.date}>{t('detail.timeline.eta')}</span>
                  ) : (
                    hasTime(m.date) && <span className={s.date}>{fmtTime(m.date)}</span>
                  )}
                </>
              ) : (
                <span className={s.date}>{m.state === 'upcoming' ? t('detail.timeline.pending') : '—'}</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
