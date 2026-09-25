'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber, fmtPct } from '@/i18n/format'
import type { BarRow } from './compute'
import s from './analytics.module.css'

/** Horizontal bars: label + count + % are always visible text; colour only reinforces identity. */
export function BreakdownBars({ rows, total, label }: { rows: BarRow[]; total: number; label: string }) {
  const { t, lang } = useI18n()
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <ul className={s.bars} aria-label={label}>
      {rows.map((r) => {
        const pct = total ? (r.count / total) * 100 : 0
        return (
          <li key={r.key} className={s.barRow}>
            <span className={s.barLabel}>
              <span className={s.barDot} style={{ background: r.color }} aria-hidden />
              {t(r.labelKey)}
            </span>
            <span className={s.barTrack} aria-hidden>
              {r.count > 0 && <span className={s.barFill} style={{ width: `${(r.count / max) * 100}%`, background: r.color }} />}
            </span>
            <span className={`${s.barCount} tnum`}>{fmtNumber(r.count, lang)}</span>
            <span className={`${s.barPct} tnum`}>{fmtPct(pct, 0)}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** A 100% split bar for two or three categories (e.g. FCL vs LCL) with a text legend. */
export function SplitBar({ title, parts }: { title: string; parts: { key: string; label: string; count: number; color: string }[] }) {
  const { lang } = useI18n()
  const total = parts.reduce((a, p) => a + p.count, 0)
  return (
    <div className={s.split}>
      <p className={s.splitTitle}>{title}</p>
      <div className={s.splitBar} aria-hidden>
        {parts
          .filter((p) => p.count > 0)
          .map((p) => (
            <span key={p.key} style={{ flexGrow: p.count, background: p.color }} />
          ))}
        {total === 0 && <span style={{ flexGrow: 1, background: 'var(--border-soft)' }} />}
      </div>
      <ul className={s.splitLegend}>
        {parts.map((p) => (
          <li key={p.key}>
            <span className={s.barDot} style={{ background: p.color }} aria-hidden />
            <span className={s.splitLabel}>{p.label}</span>
            <span className="tnum">
              <strong>{fmtNumber(p.count, lang)}</strong> · {fmtPct(total ? (p.count / total) * 100 : 0, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
