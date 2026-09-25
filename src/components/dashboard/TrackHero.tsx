'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { SearchField } from '@/adapters/shipmentAdapter'
import { useI18n } from '@/i18n/I18nProvider'
import s from './hero.module.css'

const FIELDS: SearchField[] = ['all', 'bl', 'hbl', 'container', 'booking', 'po', 'reference']

/**
 * Dashboard hero (spec §5.2, reference-v2 01): light blue-gray banner with the port photo faded in on the
 * right, tracking search + field pills. Submits to Shipment Tracking. Status counts live in Shipment Overview.
 */
export function TrackHero() {
  const { t } = useI18n()
  const router = useRouter()
  const id = useId()
  const [q, setQ] = useState('')
  const [field, setField] = useState<SearchField>('all')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (field !== 'all') params.set('field', field)
    const qs = params.toString()
    router.push(qs ? `/shipments?${qs}` : '/shipments')
  }

  return (
    <section className={s.hero}>
      <div className={s.photo} aria-hidden />
      <div className={s.copy}>
        <h1 className={s.title}>{t('dashboard.hero.title')}</h1>
        <p className={s.subtitle}>{t('dashboard.hero.subtitle')}</p>
        <form role="search" className={s.search} onSubmit={submit}>
          <label htmlFor={id} className="sr-only">
            {t('dashboard.hero.searchLabel')}
          </label>
          <Search size={18} className={s.searchIcon} aria-hidden />
          <input
            id={id}
            className={s.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('dashboard.hero.placeholder')}
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" className={s.searchBtn}>
            {t('common.search.submit')}
          </Button>
        </form>
        <div className={s.pills} role="group" aria-label={t('dashboard.hero.fieldsLabel')}>
          {FIELDS.map((f) => (
            <button key={f} type="button" className={s.pill} aria-pressed={field === f} onClick={() => setField(f)}>
              {t(`dashboard.hero.fields.${f}`)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
