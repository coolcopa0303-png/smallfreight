'use client'

import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/i18n/I18nProvider'
import type { SummaryRow } from './quoteUtils'
import s from './page.module.css'

/** Result screen header shared by LTL and drayage quotes: back to the form · quote number · new quote. */
export function QuoteResultHeader({ title, onEdit, onNewQuote }: { title: string; onEdit: () => void; onNewQuote: () => void }) {
  const { t } = useI18n()
  return (
    <header className={s.resultHead}>
      <button type="button" className={s.back} onClick={onEdit}>
        <ArrowLeft size={18} aria-hidden />
        {t('quotes.result.editRequest')}
      </button>
      <h1 className={s.resultTitle}>{title}</h1>
      <Button leading={<Plus size={18} />} onClick={onNewQuote}>
        {t('quotes.result.newQuote')}
      </Button>
    </header>
  )
}

/** One-line recap of what was quoted (weight, pieces, dimensions, accessorials…). */
export function QuoteSummary({ rows, extra }: { rows: SummaryRow[]; extra?: SummaryRow }) {
  const all = extra ? [...rows, extra] : rows
  if (!all.length) return null
  return (
    <Card className={s.summary}>
      <dl>
        {all.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
