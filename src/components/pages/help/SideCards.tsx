'use client'

import { ArrowRight, Clock, Headset, Phone } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/Card'
import { useI18n } from '@/i18n/I18nProvider'
import { SUPPORT } from '@/services/announcements'
import s from './help.module.css'

const QUICK_LINKS = [
  { href: '/quotes/ltl', labelKey: 'nav.getQuote' },
  { href: '/hts', labelKey: 'help.contact.askCustoms' },
  { href: '/my-inquiries', labelKey: 'nav.myInquiries' },
  { href: '/shipments', labelKey: 'nav.shipmentTracking' },
]

export function ContactCard() {
  const { t } = useI18n()
  const tel = `tel:+1${SUPPORT.phone.replace(/\D/g, '')}`
  return (
    <Card>
      <CardHeader icon={<Headset size={22} />} title={t('help.contact.title')} subtitle={t('help.contact.subtitle')} />
      <a href={tel} className={s.phone} aria-label={t('help.contact.callAria', { phone: SUPPORT.phone })}>
        <span className={s.phoneIcon} aria-hidden>
          <Phone size={18} />
        </span>
        <span className={s.phoneText}>
          <span className={s.phoneLabel}>{t('help.contact.phone')}</span>
          <span className={`${s.phoneNumber} tnum`}>{SUPPORT.phone}</span>
        </span>
      </a>
      <p className={s.hours}>
        <Clock size={16} aria-hidden />
        <span>
          <strong>{t('help.contact.hoursLabel')}</strong> {t('help.contact.hours')}
          <span className={s.hoursNote}>{t('help.contact.hoursNote')}</span>
        </span>
      </p>
      <nav aria-label={t('help.contact.linksLabel')}>
        <ul className={s.quickLinks}>
          {QUICK_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                {t(l.labelKey)}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  )
}
