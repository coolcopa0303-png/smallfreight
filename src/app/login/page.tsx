'use client'

import { Lock, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'
import { mutate } from 'swr'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { DATA_MODE } from '@/lib/api/client'
import { login } from '@/services/auth'
import s from './login.module.css'

function LoginForm() {
  const { t, lang, setLang } = useI18n()
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      await login(email, password)
      await mutate('me', undefined, { revalidate: true })
      const next = params.get('next')
      router.replace(next && next.startsWith('/') ? next : '/dashboard')
    } catch {
      setError(t('account.login.invalid'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={s.card} onSubmit={submit}>
      <div className={s.brand}>
        <LogoMark className={s.mark} />
        <span>
          SMALL <b>FREIGHT</b>
        </span>
      </div>
      <h1 className={s.title}>{t('account.login.title')}</h1>
      <p className={s.subtitle}>{t('account.login.subtitle')}</p>
      <Field label={t('account.login.email')} required htmlFor="login-email">
        <Input id="login-email" type="email" autoComplete="email" required leading={<Mail size={17} />} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t('account.login.password')} required htmlFor="login-password" error={error}>
        <Input id="login-password" type="password" autoComplete="current-password" required leading={<Lock size={17} />} value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
      </Field>
      <Button type="submit" size="lg" block loading={busy}>
        {t('account.login.submit')}
      </Button>
      {DATA_MODE === 'mock' && <p className={s.demo}>{t('account.login.demo')}</p>}
      <div className={s.lang}>
        {(['en', 'zh-CN'] as const).map((l) => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
            {t(`common.language.${l}`)}
          </button>
        ))}
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className={s.page}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
