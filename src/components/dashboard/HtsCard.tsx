'use client'

import { FileSearch, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import { Card, CardHeader, ViewAllLink } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import s from './services.module.css'

const POPULAR = ['0101.21.0010', '8471.30.0000', '6203.49.9095', '9403.60.8081', '0306.17.0000', '3923.21.0000']

/** HTS quick search — Enter opens the HTS page (spec §5.3). */
export function HtsCard() {
  const { t } = useI18n()
  const router = useRouter()
  const id = useId()
  const [q, setQ] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    router.push(q.trim() ? `/hts?q=${encodeURIComponent(q.trim())}` : '/hts')
  }

  return (
    <Card className={s.svc}>
      <CardHeader
        icon={<FileSearch size={28} strokeWidth={1.8} />}
        title={t('dashboard.hts.title')}
        action={<ViewAllLink href="/my-inquiries?tab=hts">{t('common.actions.viewAll')}</ViewAllLink>}
      />
      <form role="search" className={s.htsForm} onSubmit={submit}>
        <label htmlFor={id} className="sr-only">
          {t('dashboard.hts.searchLabel')}
        </label>
        <Input
          id={id}
          className={`${s.ctl} ${s.htsInput}`}
          leading={<Search size={14} />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('dashboard.hts.placeholder')}
          autoComplete="off"
          trailing={
            <button type="submit" className={s.htsGo} aria-label={t('dashboard.hts.searchLabel')}>
              <Search size={18} />
            </button>
          }
        />
      </form>
      <h3 className={s.popularTitle}>{t('dashboard.hts.popular')}</h3>
      <ul className={s.chips}>
        {POPULAR.map((code) => (
          <li key={code}>
            <Link href={`/hts?q=${encodeURIComponent(code)}`} className={s.chip}>
              {code}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
