'use client'

import { EyeOff } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Overlay'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { Badge } from '@/components/ui/StatusChip'
import { useToast } from '@/components/ui/Toast'
import type { RateOption } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtMoney } from '@/i18n/format'
import { fetchQuotation, toggleQuotationVisible, type QuoteHistoryItem } from '@/services/quotes'
import s from './inquiries.module.css'

function RateRow({ r, cheapest }: { r: RateOption; cheapest: boolean }) {
  const { t, lang } = useI18n()
  const transit =
    r.transitDaysMin !== undefined
      ? r.transitDaysMax !== undefined && r.transitDaysMax !== r.transitDaysMin
        ? t('common.units.daysRange', { min: r.transitDaysMin, max: r.transitDaysMax })
        : r.transitDaysMin === 1
          ? t('common.units.day')
          : t('common.units.days', { count: r.transitDaysMin })
      : undefined
  return (
    <li className={s.rate} data-unavailable={!r.available || undefined}>
      <div className={s.rateHead}>
        <span className={s.rateCarrier}>
          {r.carrierName}
          {cheapest && <Badge tone="green">{t('inquiries.quote.cheapest')}</Badge>}
        </span>
        <span className={s.ratePrice}>{r.available && r.totalPrice !== undefined ? fmtMoney(r.totalPrice, lang) : t('inquiries.quote.unavailable')}</span>
      </div>
      {r.available && (
        <dl className={s.rateFacts}>
          {transit && <div><dt>{t('inquiries.quote.transit')}</dt><dd>{transit}</dd></div>}
          {r.estimatedDelivery && <div><dt>{t('inquiries.quote.delivery')}</dt><dd>{fmtDate(r.estimatedDelivery, lang)}</dd></div>}
          {r.expiresAt && <div><dt>{t('inquiries.quote.expires')}</dt><dd>{fmtDate(r.expiresAt, lang)}</dd></div>}
          {r.quoteNumber && <div><dt>{t('inquiries.quote.carrierQuote')}</dt><dd className="mono">{r.quoteNumber}</dd></div>}
        </dl>
      )}
      {r.breakdown && r.breakdown.length > 0 && (
        <details className={s.breakdown}>
          <summary>{t('inquiries.quote.breakdown')}</summary>
          <ul>
            {r.breakdown.map((b) => (
              <li key={b.label}>
                <span>{t(`quotes.fees.${b.label}`)}</span>
                <span className="tnum">{fmtMoney(b.amount, lang)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}

export function QuoteDrawer({ item, onClose, onHidden }: { item: QuoteHistoryItem; onClose: () => void; onHidden: () => void }) {
  const { t, lang } = useI18n()
  const toast = useToast()
  const [hiding, setHiding] = useState(false)
  const { data, error, isLoading, mutate } = useSWR(['quotation', item.id], () => fetchQuotation(item.id))
  const rates = data?.result.rates ?? []
  const prices = rates.filter((r) => r.available && r.totalPrice !== undefined).map((r) => r.totalPrice!)
  const min = prices.length ? Math.min(...prices) : undefined

  const hide = async () => {
    setHiding(true)
    try {
      await toggleQuotationVisible(item.id)
      toast(t('inquiries.quote.hidden', { number: item.number }))
      onHidden()
    } catch (e) {
      toast(t('common.toast.apiError', { message: (e as Error).message }), 'error')
    } finally {
      setHiding(false)
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={t('inquiries.quote.title', { number: item.number })}
      width={560}
      footer={
        <Button variant="neutral" leading={<EyeOff size={16} />} onClick={hide} loading={hiding}>
          {t('inquiries.quote.hide')}
        </Button>
      }
    >
      <div className={s.stack}>
        <dl className={s.facts}>
          <div><dt>{t('inquiries.quote.shipDate')}</dt><dd className="tnum">{fmtDate(item.shippingDate, lang)}</dd></div>
          <div><dt>{t('inquiries.quote.origin')}</dt><dd>{item.origin || '—'}</dd></div>
          <div><dt>{t('inquiries.quote.destination')}</dt><dd>{item.destination || '—'}</dd></div>
        </dl>
        <section>
          <h3 className={s.drawerH}>{t('inquiries.quote.rates')}</h3>
          {error ? (
            <ErrorState title={t('inquiries.quote.errorTitle')} detail={(error as Error).message} onRetry={() => mutate()} />
          ) : isLoading || !data ? (
            <div className={s.stack}>
              <Skeleton height={64} />
              <Skeleton height={64} />
              <Skeleton height={64} />
            </div>
          ) : rates.length === 0 ? (
            <p className={s.muted}>{t('inquiries.quote.noRates')}</p>
          ) : (
            <ul className={s.rates}>
              {[...rates]
                .sort((a, b) => Number(b.available) - Number(a.available) || (a.totalPrice ?? 0) - (b.totalPrice ?? 0))
                .map((r) => (
                  <RateRow key={r.id} r={r} cheapest={r.available && r.totalPrice === min} />
                ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  )
}
