'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs } from '@/components/ui/Tabs'
import { useI18n } from '@/i18n/I18nProvider'
import { HtsInquiriesTab } from './HtsInquiriesTab'
import { QuotesTab } from './QuotesTab'
import { SavedCalcsTab } from './SavedCalcsTab'
import s from './inquiries.module.css'

const TABS = ['hts', 'ltl', 'drayage', 'saved'] as const
type TabKey = (typeof TABS)[number]

/** My Inquiries (spec §1): HTS questions, LTL / drayage quote history and saved duty calculations. `?tab=` is the source of truth. */
export function MyInquiriesPage() {
  const { t } = useI18n()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const raw = params.get('tab')
  const tab: TabKey = (TABS as readonly string[]).includes(raw ?? '') ? (raw as TabKey) : 'hts'

  const setTab = (k: TabKey) => {
    const next = new URLSearchParams(params.toString())
    next.set('tab', k)
    next.delete('page')
    router.replace(`${pathname}?${next}`, { scroll: false })
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>{t('inquiries.title')}</h1>
        <p className={s.subtitle}>{t('inquiries.subtitle')}</p>
      </header>
      <section className={s.panel}>
        <Tabs label={t('inquiries.tabs.label')} value={tab} onChange={setTab} items={TABS.map((k) => ({ key: k, label: t(`inquiries.tabs.${k}`) }))} className={s.tabs} />
        <div role="tabpanel" className={s.tabBody}>
          {tab === 'hts' && <HtsInquiriesTab />}
          {tab === 'ltl' && <QuotesTab key="ltl" type="LTL" />}
          {tab === 'drayage' && <QuotesTab key="ftl" type="FTL" />}
          {tab === 'saved' && <SavedCalcsTab />}
        </div>
      </section>
    </div>
  )
}
