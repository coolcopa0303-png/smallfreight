'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Overlay'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { updatePassword } from '@/services/auth'

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return setError(t('account.passwordNotMatch'))
    setBusy(true)
    setError(undefined)
    try {
      await updatePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
      toast(t('account.passwordUpdated'))
      setForm({ oldPassword: '', newPassword: '', confirm: '' })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('account.changePassword')}
      footer={
        <>
          <Button variant="neutral" onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="submit" form="pw-form" loading={busy}>{t('common.actions.save')}</Button>
        </>
      }
    >
      <form id="pw-form" onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <Field label={t('account.oldPassword')} required htmlFor="pw-old">
          <Input id="pw-old" type="password" autoComplete="current-password" required value={form.oldPassword} onChange={set('oldPassword')} />
        </Field>
        <Field label={t('account.newPassword')} required htmlFor="pw-new">
          <Input id="pw-new" type="password" autoComplete="new-password" required minLength={6} value={form.newPassword} onChange={set('newPassword')} />
        </Field>
        <Field label={t('account.confirmPassword')} required htmlFor="pw-confirm" error={error}>
          <Input id="pw-confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} invalid={!!error} />
        </Field>
      </form>
    </Modal>
  )
}
