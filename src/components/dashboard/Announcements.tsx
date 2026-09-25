'use client'

import { CalendarDays, FileText, Info, Megaphone } from 'lucide-react'
import { Card, CardHeader, ViewAllLink } from '@/components/ui/Card'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate } from '@/i18n/format'
import { ANNOUNCEMENTS, type Announcement } from '@/services/announcements'
import s from './announcements.module.css'

function KindIcon({ kind }: { kind: Announcement['kind'] }) {
  // Neutral line icons (reference-v2 01): alert → info circle, info → document, notice → calendar.
  if (kind === 'alert') return <Info size={22} fill="currentColor" stroke="var(--surface)" strokeWidth={2.2} />
  if (kind === 'info') return <FileText size={22} strokeWidth={1.8} />
  return <CalendarDays size={22} strokeWidth={1.8} />
}

/** Static announcements until a CMS endpoint exists (spec §5.4, right-bottom). */
export function Announcements() {
  const { t, lang } = useI18n()
  return (
    <Card className={s.card}>
      <CardHeader
        icon={<Megaphone size={24} strokeWidth={1.9} />}
        title={t('dashboard.announcements.title')}
        action={<ViewAllLink href="/help#announcements">{t('common.actions.viewAll')}</ViewAllLink>}
      />
      <ul className={s.list}>
        {ANNOUNCEMENTS.slice(0, 3).map((a) => (
          <li key={a.id} className={s.item}>
            <span className={s.icon} data-kind={a.kind} role="img" aria-label={t(`dashboard.announcements.kinds.${a.kind}`)}>
              <KindIcon kind={a.kind} />
            </span>
            <div className={s.text}>
              <p className={s.title}>{a.title[lang]}</p>
              <p className={s.body}>{a.body[lang]}</p>
            </div>
            <time className={`${s.date} tnum`} dateTime={a.date}>
              {fmtDate(a.date, lang)}
            </time>
          </li>
        ))}
      </ul>
    </Card>
  )
}
