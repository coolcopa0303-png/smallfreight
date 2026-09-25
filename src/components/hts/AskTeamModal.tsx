'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Overlay'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { submitHtsInquiry } from '@/services/hts'
import s from './calculator.module.css'

/** Old portal's "+ new HTS inquiry": a broker classifies the product; answer shows in My Inquiries. */
export function AskTeamModal({ open, onClose, defaultName, onSent }: { open: boolean; onClose: () => void; defaultName?: string; onSent?: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const formId = useId()
  const ids = { name: useId(), zh: useId(), material: useId(), desc: useId() }
  const [f, setF] = useState({ productName: defaultName ?? '', productNameChinese: '', material: '', description: '' })
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.productName.trim()) return setErr(true)
    setBusy(true)
    try {
      await submitHtsInquiry({ ...f, productName: f.productName.trim() })
      toast(t('hts.toast.askSent'))
      onSent?.()
      onClose()
    } catch (x) {
      toast(t('common.toast.apiError', { message: (x as Error).message }), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('hts.ask.title')}
      width={540}
      footer={
        <>
          <Button variant="neutral" onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="submit" form={formId} loading={busy}>{t('hts.ask.submit')}</Button>
        </>
      }
    >
      <form id={formId} className={s.askForm} onSubmit={submit} noValidate>
        <p className={s.muted}>{t('hts.ask.intro')}</p>
        <Field label={t('hts.ask.productName')} required htmlFor={ids.name} error={err && !f.productName.trim() ? t('hts.ask.required') : undefined}>
          <Input id={ids.name} value={f.productName} invalid={err && !f.productName.trim()} onChange={(e) => setF({ ...f, productName: e.target.value })} data-autofocus />
        </Field>
        <div className={s.grid2}>
          <Field label={t('hts.ask.productNameZh')} htmlFor={ids.zh}>
            <Input id={ids.zh} value={f.productNameChinese} onChange={(e) => setF({ ...f, productNameChinese: e.target.value })} />
          </Field>
          <Field label={t('hts.ask.material')} htmlFor={ids.material}>
            <Input id={ids.material} value={f.material} onChange={(e) => setF({ ...f, material: e.target.value })} />
          </Field>
        </div>
        <Field label={t('hts.ask.description')} htmlFor={ids.desc}>
          <textarea id={ids.desc} className={s.textarea} rows={4} placeholder={t('hts.ask.descriptionPlaceholder')} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
      </form>
    </Modal>
  )
}
