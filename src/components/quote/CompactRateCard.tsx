'use client'

import { CalendarDays, Clock, Info, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RateOption } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney } from '@/i18n/format'
import { CarrierWordmark } from './CarrierWordmark'
import { daysLabel, moneyDigits } from './quoteUtils'
import s from './rates.module.css'

/** Drayage rate card (reference 04): compact, equal-width, six across; outlined actions, selection = blue border. */
export function CompactRateCard({ rate, selected, onSelect, onDetails, onRequest }: {
  rate: RateOption
  selected: boolean
  onSelect: () => void
  onDetails: () => void
  onRequest: () => void
}) {
  const { t, lang } = useI18n()
  const titleId = `rate-${rate.id}`
  const ok = rate.available
  return (
    <article className={s.mini} data-selected={selected || undefined} data-unavailable={!ok || undefined} aria-labelledby={titleId}>
      <div className={s.miniHead}>
        <CarrierWordmark carrier={rate.carrier} size="sm" />
        {rate.carrier !== 'uber' && <h3 id={titleId} className={s.miniName}>{rate.carrierName}</h3>}
        {rate.carrier === 'uber' && <h3 id={titleId} className="sr-only">{rate.carrierName}</h3>}
        {ok && (
          <button type="button" className={s.miniInfo} onClick={onDetails} aria-label={`${t('common.actions.viewDetails')} — ${rate.carrierName}`} title={t('common.actions.viewDetails')}>
            <Info size={16} />
          </button>
        )}
      </div>

      {ok ? (
        <>
          <p className={s.miniPrice}>
            <strong className="tnum">{fmtMoney(rate.totalPrice, lang, moneyDigits(rate.totalPrice))}</strong>
            <span>USD</span>
          </p>
          <ul className={s.miniFacts}>
            <li><CalendarDays size={15} aria-hidden />{rate.validDays ? t('quotes.rates.validFor', { count: rate.validDays }) : '—'}</li>
            <li><Clock size={15} aria-hidden />{daysLabel(t, rate.transitDaysMin, rate.transitDaysMax, true)}</li>
            <li><Truck size={15} aria-hidden />{t(`quotes.service.${rate.serviceType}Short`)}</li>
          </ul>
          {rate.breakdown?.length ? (
            <button type="button" className={s.feesLink} onClick={onDetails}>
              {t('quotes.rates.terminalFeesNote')}
            </button>
          ) : null}
          <Button variant="secondary" block className={s.miniBtn} onClick={onSelect} aria-pressed={selected}>
            {selected ? t('quotes.rates.selected') : t('quotes.rates.select')}
          </Button>
        </>
      ) : (
        <>
          <p className={s.miniNaTitle}>{t('quotes.rates.notAvailableTitle')}</p>
          <p className={s.miniNaBody}>{t('quotes.rates.customRate')}</p>
          <Button variant="secondary" block className={s.miniBtn} onClick={onRequest}>
            {t('quotes.rates.requestRate')}
          </Button>
        </>
      )}
    </article>
  )
}
