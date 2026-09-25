'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtNumber } from '@/i18n/format'
import type { MonthBucket } from './compute'
import s from './analytics.module.css'

/** Fallback plot height; the real height comes from `.chartBox` in CSS (shorter on short viewports). */
const DEFAULT_HEIGHT = 230
const PAD_TOP = 26
const PAD_BOTTOM = 40

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) =>
      setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) }),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, ...size }
}

/** Rounded-top bar anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`
}

export function EtaMonthChart({ buckets }: { buckets: MonthBucket[] }) {
  const { t, lang } = useI18n()
  const { ref, width, height } = useSize<HTMLDivElement>()
  const HEIGHT = height || DEFAULT_HEIGHT

  const monthFmt = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' })
  const fullFmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const dateOf = (b: MonthBucket) => new Date(Date.UTC(b.year, b.month, 1))
  const max = Math.max(1, ...buckets.map((b) => b.count))
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM
  const band = width / buckets.length
  const barW = Math.max(10, Math.min(44, band * 0.58))

  return (
    <div className={s.chartWrap}>
      <div ref={ref} className={s.chartBox}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} aria-hidden focusable="false" className={s.chartSvg}>
            <line x1={0} x2={width} y1={HEIGHT - PAD_BOTTOM + 0.5} y2={HEIGHT - PAD_BOTTOM + 0.5} className={s.axis} />
            {buckets.map((b, i) => {
              const h = (b.count / max) * plotH
              const x = band * i + (band - barW) / 2
              const y = HEIGHT - PAD_BOTTOM - h
              const cls = b.current ? s.barCurrent : i > buckets.findIndex((q) => q.current) ? s.barFuture : s.barPast
              const showYear = i === 0 || b.month === 0
              return (
                <g key={b.key}>
                  <title>{`${fullFmt.format(dateOf(b))}: ${fmtNumber(b.count, lang)}`}</title>
                  <rect x={band * i} y={0} width={band} height={HEIGHT} fill="transparent" />
                  {h > 0 && <path d={barPath(x, y, barW, h)} className={cls} />}
                  <text x={x + barW / 2} y={y - 7} textAnchor="middle" className={`${s.valueLabel} ${b.current ? s.valueCurrent : ''}`}>
                    {fmtNumber(b.count, lang)}
                  </text>
                  <text x={x + barW / 2} y={HEIGHT - PAD_BOTTOM + 17} textAnchor="middle" className={`${s.monthLabel} ${b.current ? s.monthCurrent : ''}`}>
                    {monthFmt.format(dateOf(b))}
                  </text>
                  {showYear && (
                    <text x={x + barW / 2} y={HEIGHT - PAD_BOTTOM + 32} textAnchor="middle" className={s.yearLabel}>
                      {b.year}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
      </div>
      <div className={s.chartLegend}>
        <span><i className={`${s.swatch} ${s.swatchPast}`} aria-hidden />{t('analytics.eta.past')}</span>
        <span><i className={`${s.swatch} ${s.swatchCurrent}`} aria-hidden />{t('analytics.eta.current')}</span>
        <span><i className={`${s.swatch} ${s.swatchFuture}`} aria-hidden />{t('analytics.eta.future')}</span>
      </div>
      <table className="sr-only">
        <caption>{t('analytics.eta.title')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('analytics.eta.month')}</th>
            <th scope="col">{t('analytics.eta.count')}</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.key}>
              <th scope="row">{fullFmt.format(dateOf(b))}</th>
              <td>{b.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
