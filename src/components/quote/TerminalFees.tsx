'use client'

import { ChevronDown, Receipt } from 'lucide-react'
import { useId, useState } from 'react'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtMoney } from '@/i18n/format'
import { moneyDigits } from './quoteUtils'
import s from './route.module.css'

/** Terminal accessorial price sheet from /api/ftl-addresses (possible charges, not included in rates). */
export function TerminalFees({ fees }: { fees: { label: string; amount: number }[] }) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const id = useId()
  if (!fees.length) return null
  return (
    <div className={s.fees}>
      <button type="button" className={s.feesToggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <Receipt size={16} aria-hidden />
        <span>{t('quotes.route.terminalFees', { count: fees.length })}</span>
        <ChevronDown size={16} aria-hidden className={s.feesChev} data-open={open || undefined} />
      </button>
      {open && (
        <div id={id}>
          <dl className={s.feesList}>
          {fees.map((f) => (
            <div key={f.label} className={s.feeRow}>
              <dt>{t(`quotes.fees.${f.label}`)}</dt>
              <dd className="tnum">{fmtMoney(f.amount, lang, moneyDigits(f.amount))}</dd>
            </div>
          ))}
          </dl>
          <p className={s.feesNote}>{t('quotes.details.terminalFeesNote')}</p>
        </div>
      )}
    </div>
  )
}
