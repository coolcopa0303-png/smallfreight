'use client'

import { Copy, Mail, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { RouteMap, type MapMarker } from '@/components/map/RouteMap'
import { Card } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import type { DrayageQuote } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney, fmtNumber } from '@/i18n/format'
import { escapeHtml, moneyDigits, shortTerminal } from './quoteUtils'
import s from './drayage.module.css'
import { useRoute } from './useRoute'

/** Quote desk contact shown in the old result page's disclaimer. */
const QUOTE_DESK = { phone: '(516) 962-0966', email: 'SHAKEH@SENMARTINTL.COM' }

type T = ReturnType<typeof useI18n>['t']

/** "LOS ANGELES, CA Port of LA(...) To: Walnut CA 91789 - Type: 40' Container" — the old result page's lane line. */
function laneText(t: T, q: DrayageQuote) {
  const type = q.containers.map((c) => t(`quotes.container.${c}`)).join(', ')
  const to = [q.destination.city, q.destination.state, q.destination.zip].filter(Boolean).join(' ')
  return `${q.port.city.toUpperCase()}, ${q.port.state} ${q.port.terminal} ${t('quotes.dray.to')}: ${to}${type ? ` - ${t('quotes.dray.type')}: ${type}` : ''}`
}

/** Base rate + chassis = estimated total, then the terminal's other accessorial items. Also used in My Inquiries. */
export function DrayagePriceSheet({ quote: q, flat }: { quote: DrayageQuote; flat?: boolean }) {
  const { t, lang } = useI18n()
  const money = (n: number) => fmtMoney(n, lang, moneyDigits(n))
  const Box = flat ? 'section' : Card
  return (
    <>
      <Box className={s.block}>
        <p className={s.lane}>{laneText(t, q)}</p>
        {q.baseRate === undefined ? (
          <p className={s.noRate}>{t('quotes.dray.noRate')}</p>
        ) : (
          <dl className={s.priceList}>
            <div>
              <dt>{t('quotes.dray.baseRate')}</dt>
              <dd className="tnum">{money(q.baseRate)}</dd>
            </div>
            <div>
              <dt>{t('quotes.dray.chassisLine', { days: q.chassisMinDays })}</dt>
              <dd className="tnum">{money(q.chassisPerDay)}</dd>
            </div>
            <div className={s.totalRow}>
              <dt>{t('quotes.dray.total')}</dt>
              <dd className="tnum">{money(q.estimatedTotal!)}</dd>
            </div>
          </dl>
        )}
      </Box>
      {q.otherFees.length > 0 && (
        <Box className={s.block}>
          <h3 className={s.feesTitle}>{t('quotes.dray.otherTitle')}</h3>
          <table className={s.feesTable}>
            <tbody>
              {q.otherFees.map((f) => (
                <tr key={f.label}>
                  <th scope="row">{t(`quotes.dray.fee.${f.label}`)}</th>
                  <td className="tnum">{money(f.amount)}</td>
                  <td>{t(`quotes.dray.unit.${f.unit}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </>
  )
}

/** SMALL FREIGHT's own drayage rate (old FCL quote result): price sheet + route map + disclaimer. */
export function DrayageQuoteResult({ status, quote, onRetry }: {
  status: 'loading' | 'done' | 'error'
  quote?: DrayageQuote
  onRetry: () => void
}) {
  const { t } = useI18n()
  if (status === 'error') {
    return (
      <Card>
        <ErrorState title={t('quotes.dray.error')} onRetry={onRetry} />
      </Card>
    )
  }
  if (status === 'loading' || !quote) {
    return (
      <div className={s.result} aria-busy>
        <div className={s.resultMain}>
          <Card className={s.block}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={18} />)}
          </Card>
        </div>
        <Skeleton height={320} />
      </div>
    )
  }
  return <Loaded quote={quote} />
}

function Loaded({ quote: q }: { quote: DrayageQuote }) {
  const { t, lang } = useI18n()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const { route } = useRoute(q.port.point, q.destination.point)
  const money = (n: number) => fmtMoney(n, lang, moneyDigits(n))

  const lane = laneText(t, q)
  const chassisLabel = t('quotes.dray.chassisLine', { days: q.chassisMinDays })

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = []
    if (q.port.point) m.push({ point: q.port.point, kind: 'port', label: escapeHtml(shortTerminal(q.port)), labelDirection: 'bottom' })
    if (q.destination.point) m.push({ point: q.destination.point, kind: 'pinRed', label: escapeHtml(`${q.destination.city}, ${q.destination.state} ${q.destination.zip}`) })
    return m
  }, [q])

  const copyText = () => {
    const rows = [
      lane,
      q.baseRate === undefined ? t('quotes.dray.noRate') : `${t('quotes.dray.baseRate')}: ${money(q.baseRate)}`,
      q.baseRate === undefined ? '' : `${chassisLabel}: ${money(q.chassisPerDay)}`,
      q.estimatedTotal === undefined ? '' : `${t('quotes.dray.total')}: ${money(q.estimatedTotal)}`,
      '',
      t('quotes.dray.otherTitle'),
      ...q.otherFees.map((f) => `${t(`quotes.dray.fee.${f.label}`)}: ${money(f.amount)} ${t(`quotes.dray.unit.${f.unit}`)}`),
    ]
    return rows.filter((r, i) => r || rows[i - 1]).join('\n')
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast(t('quotes.dray.copyFailed'), 'error')
    }
  }
  const mailto = `mailto:${QUOTE_DESK.email}?${new URLSearchParams({ subject: t('quotes.dray.mailSubject', { number: q.quotationNumber }), body: copyText() })}`.replace(/\+/g, '%20')

  return (
    <section className={s.resultWrap} aria-label={t('quotes.dray.resultLabel')}>
      <div className={s.toolbar}>
        <a className={s.toolBtn} href={mailto}>
          <Mail size={17} aria-hidden />
          {t('quotes.dray.contactUs')}
        </a>
        <button type="button" className={s.toolBtn} onClick={() => window.print()}>
          <Printer size={17} aria-hidden />
          {t('quotes.dray.print')}
        </button>
        <button type="button" className={s.toolBtn} onClick={() => void onCopy()}>
          <Copy size={17} aria-hidden />
          {copied ? t('quotes.dray.copied') : t('quotes.dray.copy')}
        </button>
      </div>

      <div className={s.result}>
        <div className={s.resultMain}>
          <DrayagePriceSheet quote={q} />
        </div>

        <div className={s.resultSide}>
          <Card padded={false} className={s.mapCard}>
            <RouteMap
              markers={markers}
              path={route?.path}
              padding={50}
              ariaLabel={t('quotes.route.mapLabel', { from: shortTerminal(q.port), to: `${q.destination.city}, ${q.destination.state}` })}
            />
            {route && (
              <span className={s.miles}>
                {t(route.approximate ? 'quotes.dray.milesApprox' : 'quotes.dray.miles', { count: fmtNumber(route.miles, lang, 1) })}
              </span>
            )}
          </Card>
          <div className={s.disclaimer}>
            <h3>{t('quotes.dray.disclaimer')}</h3>
            <ul>
              <li>{t('quotes.dray.disclaimerSingle')}</li>
              <li>
                {t('quotes.dray.disclaimerContact')}
                <br />
                {t('quotes.dray.disclaimerPhone')} <a href={`tel:${QUOTE_DESK.phone.replace(/[^\d]/g, '')}`}>{QUOTE_DESK.phone}</a>
                <br />
                {t('quotes.dray.disclaimerEmail')} <a href={`mailto:${QUOTE_DESK.email}`}>{QUOTE_DESK.email}</a>
              </li>
              <li>{t('quotes.dray.disclaimerChange')}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
