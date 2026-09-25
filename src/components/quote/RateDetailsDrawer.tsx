'use client'

import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Overlay'
import { Copyable } from '@/components/ui/misc'
import type { RateOption } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtMoney } from '@/i18n/format'
import { CarrierWordmark } from './CarrierWordmark'
import { daysLabel, moneyDigits, type QuoteKind, type SummaryRow } from './quoteUtils'
import s from './details.module.css'

/** View Details (spec §7.4): price, numbers, delivery estimate, expiration, charges, shipment summary. */
export function RateDetailsDrawer({ rate, kind, quotationNumber, summary, accessorials, onClose, onSelect }: {
  rate?: RateOption
  kind: QuoteKind
  quotationNumber?: string
  summary: SummaryRow[]
  accessorials: string[]
  onClose: () => void
  onSelect: (r: RateOption) => void
}) {
  const { t, lang } = useI18n()
  return (
    <Drawer
      open={!!rate}
      onClose={onClose}
      title={t('quotes.details.title')}
      width={480}
      footer={
        rate && (
          <>
            <Button variant="neutral" onClick={onClose}>{t('common.actions.close')}</Button>
            <Button onClick={() => onSelect(rate)}>{t('quotes.rates.select')}</Button>
          </>
        )
      }
    >
      {rate && (
        <div className={s.drawer}>
          <div className={s.hero}>
            <CarrierWordmark carrier={rate.carrier} />
            <div className={s.heroText}>
              <strong>{rate.carrierName}</strong>
              <span>{t(rate.carrierTagline)}</span>
            </div>
            <div className={s.heroPrice}>
              <strong className="tnum">{fmtMoney(rate.totalPrice, lang, moneyDigits(rate.totalPrice))}</strong>
              <span>{t('quotes.rates.totalPrice')} · USD</span>
            </div>
          </div>

          <section aria-labelledby="rd-quote">
            <h3 id="rd-quote" className={s.h}>{t('quotes.details.quote')}</h3>
            <dl className={s.kv}>
              <dt>{t('quotes.details.quoteNumber')}</dt>
              <dd><Copyable value={rate.quoteNumber} className="mono" /></dd>
              <dt>{t('quotes.details.quotationNumber')}</dt>
              <dd><Copyable value={quotationNumber} className="mono" /></dd>
              <dt>{t('quotes.rates.transitTime')}</dt>
              <dd>{daysLabel(t, rate.transitDaysMin, rate.transitDaysMax)}</dd>
              <dt>{t('quotes.rates.serviceType')}</dt>
              <dd>{t(`quotes.service.${rate.serviceType}`)}</dd>
              <dt>{t('quotes.details.estimatedDelivery')}</dt>
              <dd>{rate.estimatedDelivery ? fmtDate(rate.estimatedDelivery, lang) : t('quotes.details.onBooking')}</dd>
              <dt>{t('quotes.details.expires')}</dt>
              <dd>
                {rate.expiresAt ? fmtDate(rate.expiresAt, lang) : '—'}
                {rate.validDays ? <span className={s.muted}> · {t('quotes.rates.validFor', { count: rate.validDays })}</span> : null}
              </dd>
            </dl>
          </section>

          <section aria-labelledby="rd-charges">
            <h3 id="rd-charges" className={s.h}>{kind === 'drayage' ? t('quotes.details.terminalFees') : t('quotes.details.charges')}</h3>
            {rate.breakdown?.length ? (
              <>
                <dl className={s.kv}>
                  {rate.breakdown.map((b) => (
                    <Row key={b.label} label={t(`quotes.fees.${b.label}`)} value={fmtMoney(b.amount, lang, moneyDigits(b.amount))} />
                  ))}
                </dl>
                <p className={s.note}><Info size={14} aria-hidden />{t('quotes.details.terminalFeesNote')}</p>
              </>
            ) : (
              <p className={s.note}><Info size={14} aria-hidden />{t('quotes.details.chargesNote')}</p>
            )}
          </section>

          {kind === 'ltl' && (
            <section aria-labelledby="rd-acc">
              <h3 id="rd-acc" className={s.h}>{t('quotes.more.accessorials')}</h3>
              {accessorials.length ? (
                <ul className={s.tags}>{accessorials.map((a) => <li key={a}>{a}</li>)}</ul>
              ) : (
                <p className={s.muted}>{t('quotes.more.noAcc')}</p>
              )}
            </section>
          )}

          <section aria-labelledby="rd-ship">
            <h3 id="rd-ship" className={s.h}>{t('quotes.details.shipment')}</h3>
            <dl className={s.kv}>
              {summary.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
            </dl>
          </section>

          <p className={s.disclaimer}>{t('quotes.details.disclaimer')}</p>
        </div>
      )}
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  )
}
