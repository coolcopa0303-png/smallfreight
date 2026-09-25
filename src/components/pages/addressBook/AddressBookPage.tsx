'use client'

import { BookUser, Plus, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Overlay'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { useToast } from '@/components/ui/Toast'
import type { AddressEntry } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '@/services/addresses'
import { AddressCard, AddressCardSkeleton } from './AddressCard'
import { AddressDrawer } from './AddressDrawer'
import { displayName, matches } from './addressForm'
import s from './addressBook.module.css'

type DrawerState = { open: false } | { open: true; entry?: AddressEntry }

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function AddressBookPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { data, error, isLoading, mutate } = useSWR('addresses', fetchAddresses)
  const [query, setQuery] = useState('')
  const [drawer, setDrawer] = useState<DrawerState>({ open: false })
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<AddressEntry>()
  const [deleting, setDeleting] = useState(false)

  const list = useMemo(() => (data ?? []).filter((a) => matches(a, query.trim())), [data, query])
  const closeDrawer = useCallback(() => !saving && setDrawer({ open: false }), [saving])
  const closeDelete = useCallback(() => !deleting && setToDelete(undefined), [deleting])
  const openAdd = () => setDrawer({ open: true })

  const save = async (values: Omit<AddressEntry, 'id'>) => {
    const editing = drawer.open ? drawer.entry : undefined
    setSaving(true)
    try {
      if (editing) await updateAddress({ ...values, id: editing.id })
      else await createAddress(values)
      await mutate()
      toast(editing ? t('addressBook.toast.updated') : t('addressBook.toast.created'))
      setDrawer({ open: false })
    } catch (e) {
      toast(t('common.toast.apiError', { message: errMsg(e) }), 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteAddress(toDelete.id)
      await mutate((l) => l?.filter((a) => a.id !== toDelete.id), { revalidate: true })
      toast(t('addressBook.toast.deleted'))
      setToDelete(undefined)
    } catch (e) {
      toast(t('common.toast.apiError', { message: errMsg(e) }), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const total = data?.length ?? 0
  let body
  if (error && !data) {
    body = <ErrorState title={t('addressBook.loadError')} detail={errMsg(error)} onRetry={() => mutate()} />
  } else if (isLoading || !data) {
    body = (
      <div className={s.grid} aria-busy="true" aria-label={t('common.states.loading')}>
        {Array.from({ length: 6 }, (_, i) => <AddressCardSkeleton key={i} />)}
      </div>
    )
  } else if (total === 0) {
    body = (
      <div className={s.stateWrap}>
        <EmptyState
          icon={<BookUser size={22} />}
          title={t('addressBook.empty.title')}
          body={t('addressBook.empty.body')}
          action={<Button leading={<Plus size={16} />} onClick={openAdd}>{t('addressBook.empty.action')}</Button>}
        />
      </div>
    )
  } else if (list.length === 0) {
    body = (
      <div className={s.stateWrap}>
        <EmptyState
          title={t('addressBook.noResults.title', { query: query.trim() })}
          body={t('addressBook.noResults.body')}
          action={<Button variant="secondary" onClick={() => setQuery('')}>{t('addressBook.noResults.clear')}</Button>}
        />
      </div>
    )
  } else {
    body = (
      <ul className={s.grid} aria-label={t('addressBook.title')}>
        {list.map((a) => (
          <li key={a.id} className={s.item}>
            <AddressCard entry={a} onEdit={() => setDrawer({ open: true, entry: a })} onDelete={() => setToDelete(a)} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>{t('addressBook.title')}</h1>
          <p className={s.subtitle}>{t('addressBook.subtitle')}</p>
        </div>
      </header>

      <div className={s.toolbar}>
        <Input
          className={s.search}
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          leading={<Search size={16} />}
          placeholder={t('addressBook.searchPlaceholder')}
          aria-label={t('addressBook.searchLabel')}
          disabled={!total}
        />
        {total > 0 && (
          <span className={s.count} aria-live="polite">
            {query.trim() ? t('addressBook.countFiltered', { count: list.length, total }) : t('addressBook.count', { count: total })}
          </span>
        )}
        <Button className={s.addBtn} leading={<Plus size={16} />} onClick={openAdd}>
          {t('addressBook.addAddress')}
        </Button>
      </div>

      {body}

      <AddressDrawer
        open={drawer.open}
        entry={drawer.open ? drawer.entry : undefined}
        onClose={closeDrawer}
        onSubmit={save}
        saving={saving}
      />

      <Modal
        open={!!toDelete}
        onClose={closeDelete}
        width={440}
        title={t('addressBook.deleteTitle')}
        footer={
          <div className={s.drawerFoot}>
            <Button variant="secondary" onClick={closeDelete} disabled={deleting}>{t('common.actions.cancel')}</Button>
            <Button className={s.dangerBtn} onClick={confirmDelete} loading={deleting}>{t('common.actions.delete')}</Button>
          </div>
        }
      >
        <p className={s.confirmText}>
          {t('addressBook.deleteBody', { name: toDelete ? toDelete.company || displayName(toDelete) : '' })}
        </p>
      </Modal>
    </div>
  )
}
