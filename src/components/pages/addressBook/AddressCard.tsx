'use client'

import { Building2, Mail, MapPin, Pencil, Phone, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Flag } from '@/components/ui/misc'
import { Skeleton } from '@/components/ui/States'
import type { AddressEntry } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { displayName, regionName } from './addressForm'
import s from './addressBook.module.css'

export function AddressCard({ entry, onEdit, onDelete }: { entry: AddressEntry; onEdit: () => void; onDelete: () => void }) {
  const { t, lang } = useI18n()
  const name = displayName(entry)
  const title = entry.company || name
  const country = regionName(entry.country, lang)
  const cityLine = [entry.city, [entry.state, entry.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <Card interactive className={s.card} aria-label={title}>
      <div className={s.cardHead}>
        <span className={s.avatar} aria-hidden>
          {entry.company ? <Building2 size={18} /> : <User size={18} />}
        </span>
        <div className={s.headText}>
          <h3 className={s.company}>{title}</h3>
          {entry.company && name && <p className={s.contact}>{name}</p>}
        </div>
      </div>

      <dl className={s.lines}>
        <div className={s.line}>
          <dt><MapPin size={15} aria-label={t('addressBook.labels.address')} /></dt>
          <dd>
            {entry.street && <span className={s.block}>{entry.street}</span>}
            {entry.street2 && <span className={s.block}>{entry.street2}</span>}
            <span className={s.cityLine}>
              {cityLine}
              <span className={s.country}>
                <Flag code={entry.country} width={18} title={country} />
                {country}
              </span>
            </span>
          </dd>
        </div>
        {entry.phone && (
          <div className={s.line}>
            <dt><Phone size={15} aria-label={t('addressBook.fields.phone')} /></dt>
            <dd>
              <a href={`tel:${entry.phone.replace(/[^\d+]/g, '')}`} className={s.link}>{entry.phone}</a>
              {entry.phoneExt && <span className={s.muted}> {t('addressBook.extShort', { ext: entry.phoneExt })}</span>}
            </dd>
          </div>
        )}
        {entry.email && (
          <div className={s.line}>
            <dt><Mail size={15} aria-label={t('addressBook.fields.email')} /></dt>
            <dd><a href={`mailto:${entry.email}`} className={`${s.link} ${s.ellipsis}`}>{entry.email}</a></dd>
          </div>
        )}
      </dl>

      <div className={s.actions}>
        <Button variant="secondary" size="sm" leading={<Pencil size={14} />} onClick={onEdit} aria-label={`${t('common.actions.edit')} ${title}`}>
          {t('common.actions.edit')}
        </Button>
        <Button variant="ghost" size="sm" className={s.danger} leading={<Trash2 size={14} />} onClick={onDelete} aria-label={`${t('common.actions.delete')} ${title}`}>
          {t('common.actions.delete')}
        </Button>
      </div>
    </Card>
  )
}

export function AddressCardSkeleton() {
  return (
    <Card className={s.card} aria-hidden>
      <div className={s.cardHead}>
        <Skeleton width={36} height={36} radius={8} />
        <div className={s.headText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
        </div>
      </div>
      <div className={s.lines}>
        <Skeleton width="80%" />
        <Skeleton width="65%" />
        <Skeleton width="50%" />
      </div>
      <div className={s.actions}>
        <Skeleton width={72} height={32} radius={7} />
        <Skeleton width={80} height={32} radius={7} />
      </div>
    </Card>
  )
}
