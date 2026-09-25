'use client'

import { ArrowRight, Package, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RateOption } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney } from '@/i18n/format'
import { CarrierWordmark } from './CarrierWordmark'
import { daysLabel } from './quoteUtils'
import s from './rates.module.css'

/** LTL rate card (reference 03): wordmark · name · price / 3 facts / Select Quote + View Details. */
export function RateCard({ rate, selected, onSelect, onDetails, onRequest }: {
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
    <article className={s.card} data-selected={selected || undefined} data-unavailable={!ok || undefined} aria-labelledby={titleId}>
      <div className={s.cardTop}>
        <CarrierWordmark carrier={rate.carrier} muted={!ok} />
        <div className={s.carrier}>
          <h3 id={titleId} className={s.carrierName}>{rate.carrierName}</h3>
          <p className={s.tagline}>{t(rate.carrierTagline)}</p>
        </div>
        <div className={s.price}>
          {ok ? (
            <>
              <strong className="tnum">{fmtMoney(rate.totalPrice, lang)}</strong>
              <span>{t('quotes.rates.totalPrice')}</span>
            </>
          ) : (
            <>
              <strong className={s.priceNa}>—</strong>
              <span>{t('quotes.rates.totalPrice')}</span>
            </>
          )}
        </div>
      </div>

      {ok ? (
        <ul className={s.facts}>
          <li>
            <Truck size={20} aria-hidden />
            <span><b>{daysLabel(t, rate.transitDaysMin, rate.transitDaysMax)}</b><small>{t('quotes.rates.transitTime')}</small></span>
          </li>
          <li>
            <Package size={20} aria-hidden />
            <span><b>{t(`quotes.service.${rate.serviceType}Short`)}</b><small>{t('quotes.rates.serviceType')}</small></span>
          </li>
          <li>
            <span className={s.dot} aria-hidden />
            <span><b>{t('quotes.rates.available')}</b><small>{t('quotes.rates.availability')}</small></span>
          </li>
        </ul>
      ) : (
        <div className={s.naRow}>
          <span className={s.naDot} aria-hidden />
          <span><b>{t('quotes.rates.notAvailable')}</b><small>{t('quotes.rates.notAvailableHint')}</small></span>
        </div>
      )}

      <div className={s.actions}>
        {ok ? (
          <>
            <Button size="sm" className={s.selectBtn} onClick={onSelect} aria-pressed={selected}>
              {selected ? t('quotes.rates.selected') : t('quotes.rates.select')}
            </Button>
            <button type="button" className={s.detailsLink} onClick={onDetails}>
              {t('common.actions.viewDetails')}
              <ArrowRight size={16} aria-hidden />
            </button>
          </>
        ) : (
          <Button size="sm" variant="secondary" className={s.selectBtn} onClick={onRequest}>
            {t('quotes.rates.requestRate')}
          </Button>
        )}
      </div>
    </article>
  )
}
