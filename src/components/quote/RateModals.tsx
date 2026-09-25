'use client'

import { CheckCircle2, MessageSquareText, Phone } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import { Copyable } from '@/components/ui/misc'
import type { RateOption } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney } from '@/i18n/format'
import { SUPPORT } from '@/services/announcements'
import { CarrierWordmark } from './CarrierWordmark'
import { moneyDigits, type QuoteKind, type SummaryRow } from './quoteUtils'
import s from './details.module.css'

const tel = `tel:${SUPPORT.phone.replace(/[^\d+]/g, '')}`

/** Confirmation after "Select Quote" — booking is handled by the SMALL FREIGHT team (no booking API exists). */
export function SelectedQuoteModal({ rate, kind, quotationNumber, onClose }: {
  rate?: RateOption
  kind: QuoteKind
  quotationNumber?: string
  onClose: () => void
}) {
  const { t, lang } = useI18n()
  return (
    <Modal
      open={!!rate}
      onClose={onClose}
      title={t('quotes.selected.title')}
      width={500}
      footer={
        <>
          <ButtonLink href={`/my-inquiries?tab=${kind}`} variant="neutral">{t('quotes.selected.myInquiries')}</ButtonLink>
          <Button onClick={onClose} data-autofocus>{t('quotes.selected.done')}</Button>
        </>
      }
    >
      {rate && (
        <div className={s.modalBody}>
          <div className={s.selHead}>
            <CheckCircle2 size={22} className={s.okIcon} aria-hidden />
            <CarrierWordmark carrier={rate.carrier} size="sm" />
            <span className={s.selName}>{rate.carrierName}</span>
            <strong className={`${s.selPrice} tnum`}>{fmtMoney(rate.totalPrice, lang, moneyDigits(rate.totalPrice))}</strong>
          </div>
          <dl className={s.kv}>
            <dt>{t('quotes.details.quoteNumber')}</dt>
            <dd><Copyable value={rate.quoteNumber} className="mono" /></dd>
            <dt>{t('quotes.details.quotationNumber')}</dt>
            <dd><Copyable value={quotationNumber} className="mono" /></dd>
          </dl>
          <p className={s.selMsg}>{t('quotes.selected.body')}</p>
          <a className={s.phone} href={tel}>
            <Phone size={16} aria-hidden />
            {SUPPORT.phone}
          </a>
        </div>
      )}
    </Modal>
  )
}

/** "Request Rate" for lanes without a price (spec §19 — the card never disappears). */
export function RequestRateModal({ rate, quotationNumber, summary, onClose }: {
  rate?: RateOption
  quotationNumber?: string
  summary: SummaryRow[]
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <Modal
      open={!!rate}
      onClose={onClose}
      title={t('quotes.request.title')}
      width={500}
      footer={
        <>
          <Button variant="neutral" onClick={onClose}>{t('common.actions.close')}</Button>
          <a className={s.callBtn} href={tel} data-autofocus>
            <Phone size={16} aria-hidden />
            {t('quotes.request.call')}
          </a>
        </>
      }
    >
      {rate && (
        <div className={s.modalBody}>
          <div className={s.selHead}>
            <MessageSquareText size={22} className={s.reqIcon} aria-hidden />
            <CarrierWordmark carrier={rate.carrier} size="sm" />
            <span className={s.selName}>{rate.carrierName}</span>
          </div>
          <p className={s.selMsg}>{t('quotes.request.body')}</p>
          <dl className={s.kv}>
            {quotationNumber && (
              <>
                <dt>{t('quotes.details.quotationNumber')}</dt>
                <dd><Copyable value={quotationNumber} className="mono" /></dd>
              </>
            )}
            {summary.slice(0, 3).map((r) => (
              <FragmentRow key={r.label} row={r} />
            ))}
          </dl>
          <a className={s.phone} href={tel}>
            <Phone size={16} aria-hidden />
            {SUPPORT.phone}
          </a>
          <p className={s.muted}>{t('quotes.request.hint')}</p>
        </div>
      )}
    </Modal>
  )
}

function FragmentRow({ row }: { row: SummaryRow }) {
  return (
    <>
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
    </>
  )
}
