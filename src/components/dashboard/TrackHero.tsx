'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/Button'
import type { SearchField } from '@/adapters/shipmentAdapter'
import { useI18n } from '@/i18n/I18nProvider'
import { HeroKpis } from './HeroKpis'
import s from './hero.module.css'

const FIELDS: SearchField[] = ['all', 'bl', 'hbl', 'container', 'booking', 'po', 'reference']

/** Dashboard hero: tracking search + field pills (spec §5.2). Submits to Shipment Tracking. */
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
    <PageHero image="port" height={228} compactHeight={184} title={t('dashboard.hero.title')} subtitle={t('dashboard.hero.subtitle')} aside={<HeroKpis />}>
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
    </PageHero>
  )
}
