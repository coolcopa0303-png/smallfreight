'use client'

import { CircleHelp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useI18n } from '@/i18n/I18nProvider'
import { FaqAccordion } from './FaqAccordion'
import { useFaqItems } from './faqItems'
import { AnnouncementsCard, ContactCard } from './SideCards'
import s from './help.module.css'

export function HelpPage() {
  const { t } = useI18n()
  const items = useFaqItems()
  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>{t('help.title')}</h1>
        <p className={s.subtitle}>{t('help.subtitle')}</p>
      </header>
      <div className={s.layout}>
        {/* Left: FAQ (collapsed by default) + announcements. Right: contact. Balanced so the page fits one screen. */}
        <div className={s.main}>
          <Card className={s.faqCard}>
            <CardHeader icon={<CircleHelp size={22} />} title={t('help.faq.title')} subtitle={t('help.faq.subtitle')} />
            <FaqAccordion items={items} />
          </Card>
          <AnnouncementsCard />
        </div>
        <div className={s.side}>
          <ContactCard />
        </div>
      </div>
    </div>
  )
}
