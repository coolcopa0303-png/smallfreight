'use client'

import { BookUser, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import type { AddressEntry } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fetchAddresses } from '@/services/addresses'
import s from './form.module.css'

/** Address-book picker (old "Select Address" feature on the LTL form). */
export function AddressPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (a: AddressEntry) => void }) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const { data, error, isLoading, mutate } = useSWR(open ? 'addresses' : null, fetchAddresses, { revalidateOnFocus: false })
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return (data ?? []).filter((a) => !k || [a.company, a.street, a.city, a.state, a.zip].some((x) => x?.toLowerCase().includes(k)))
  }, [data, q])

  return (
    <Modal open={open} onClose={onClose} title={t('quotes.addressPicker.title')} width={560}>
      <Input
        leading={<Search size={16} />}
        placeholder={t('quotes.addressPicker.search')}
        aria-label={t('quotes.addressPicker.search')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onClear={() => setQ('')}
      />
      <div className={s.pickList}>
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} height={54} radius={8} />)}
        {error && <ErrorState title={t('quotes.addressPicker.error')} onRetry={() => void mutate()} />}
        {data && !list.length && (
          <EmptyState
            icon={<BookUser size={22} />}
            title={data.length ? t('quotes.addressPicker.noMatch') : t('quotes.addressPicker.empty')}
            action={!data.length && <ButtonLink href="/address-book" variant="secondary" size="sm">{t('quotes.addressPicker.manage')}</ButtonLink>}
          />
        )}
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            className={s.pickItem}
            onClick={() => {
              onPick(a)
              onClose()
            }}
          >
            <MapPin size={16} aria-hidden className={s.pickIcon} />
            <span className={s.pickText}>
              <strong>{a.company || [a.firstName, a.lastName].filter(Boolean).join(' ') || `${a.city}, ${a.state}`}</strong>
              <span>{[a.street, a.street2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean).join(', ')}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
