'use client'

import { MessageSquare, Phone, Receipt } from 'lucide-react'
import { EmptyState } from '@/components/ui/States'
import { useI18n } from '@/i18n/I18nProvider'
import { SUPPORT } from '@/services/announcements'
import s from './tabs.module.css'

/** Charges / Communications — no API exists yet, so explain and point to support. */
export function SupportTab({ kind }: { kind: 'charges' | 'communications' }) {
  const { t } = useI18n()
  const tel = SUPPORT.phone.replace(/[^\d+]/g, '')
  return (
    <section className={s.supportCard}>
      <EmptyState
        icon={kind === 'charges' ? <Receipt size={22} /> : <MessageSquare size={22} />}
        title={t(`detail.${kind}.title`)}
        body={t(`detail.${kind}.body`, { phone: SUPPORT.phone })}
        action={
          <a href={`tel:${tel}`} className={s.phoneLink}>
            <Phone size={16} aria-hidden />
            {SUPPORT.phone}
          </a>
        }
      />
    </section>
  )
}
