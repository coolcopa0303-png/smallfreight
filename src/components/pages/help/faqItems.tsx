'use client'

import Link from 'next/link'
import type { ShipmentStatus } from '@/domain/types'
import { StatusChip, ToneChip } from '@/components/ui/StatusChip'
import type { StatusTone } from '@/domain/statusMap'
import { useI18n } from '@/i18n/I18nProvider'
import type { FaqItem } from './FaqAccordion'
import s from './help.module.css'

const STATUS_GUIDE: { key: string; status: ShipmentStatus; completed?: boolean }[] = [
  { key: 'pending', status: 'pending' },
  { key: 'inTransit', status: 'inTransit' },
  { key: 'customs', status: 'customs' },
  { key: 'atPort', status: 'atPort' },
  { key: 'outForDelivery', status: 'outForDelivery' },
  { key: 'delivered', status: 'delivered' },
  { key: 'completed', status: 'delivered', completed: true },
  { key: 'exception', status: 'exception' },
]

const LFD_LEVELS: { key: string; tone: StatusTone }[] = [
  { key: 'normal', tone: 'gray' },
  { key: 'warning', tone: 'orange' },
  { key: 'overdue', tone: 'red' },
]

function Bullets({ prefix, count }: { prefix: string; count: number }) {
  const { t } = useI18n()
  return (
    <ul className={s.bullets}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>{t(`${prefix}.${i + 1}`)}</li>
      ))}
    </ul>
  )
}

export function useFaqItems(): FaqItem[] {
  const { t } = useI18n()
  return [
    {
      id: 'statuses',
      question: t('help.faq.statuses.q'),
      content: (
        <>
          <p className={s.faqIntro}>{t('help.faq.statuses.intro')}</p>
          <dl className={s.guide}>
            {STATUS_GUIDE.map((g) => (
              <div key={g.key} className={s.guideRow}>
                <dt>
                  <StatusChip status={g.status} completed={g.completed} size="sm" />
                </dt>
                <dd>{t(`help.faq.statuses.${g.key}`)}</dd>
              </div>
            ))}
          </dl>
        </>
      ),
    },
    {
      id: 'lfd',
      question: t('help.faq.lfd.q'),
      content: (
        <>
          <p className={s.faqIntro}>{t('help.faq.lfd.intro')}</p>
          <dl className={s.guide}>
            {LFD_LEVELS.map((l) => (
              <div key={l.key} className={s.guideRow}>
                <dt>
                  <ToneChip tone={l.tone} size="sm">
                    {t(`help.faq.lfd.${l.key}.label`)}
                  </ToneChip>
                </dt>
                <dd>{t(`help.faq.lfd.${l.key}.text`)}</dd>
              </div>
            ))}
          </dl>
          <p className={s.faqNote}>{t('help.faq.lfd.tip')}</p>
        </>
      ),
    },
    {
      id: 'quotes',
      question: t('help.faq.quotes.q'),
      content: (
        <>
          <p className={s.faqIntro}>
            <strong>{t('nav.ltlQuote')}:</strong> {t('help.faq.quotes.ltl')}
          </p>
          <p className={s.faqIntro}>
            <strong>{t('nav.drayageQuote')}:</strong> {t('help.faq.quotes.drayage')}
          </p>
          <Bullets prefix="help.faq.quotes.points" count={2} />
          <p className={s.faqLinks}>
            <Link href="/quotes/ltl">{t('nav.ltlQuote')}</Link>
            <Link href="/quotes/drayage">{t('nav.drayageQuote')}</Link>
          </p>
        </>
      ),
    },
    {
      id: 'hts',
      question: t('help.faq.hts.q'),
      content: (
        <>
          <p className={s.faqIntro}>{t('help.faq.hts.intro')}</p>
          <Bullets prefix="help.faq.hts.points" count={3} />
          <p className={s.faqLinks}>
            <Link href="/hts">{t('help.faq.hts.link')}</Link>
          </p>
        </>
      ),
    },
    {
      id: 'addressBook',
      question: t('help.faq.addressBook.q'),
      content: (
        <>
          <p className={s.faqIntro}>{t('help.faq.addressBook.a')}</p>
          <p className={s.faqLinks}>
            <Link href="/address-book">{t('nav.addressBook')}</Link>
          </p>
        </>
      ),
    },
    {
      id: 'language',
      question: t('help.faq.language.q'),
      content: <p className={s.faqIntro}>{t('help.faq.language.a')}</p>,
    },
  ]
}
