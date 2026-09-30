'use client'

import { ArrowRight, Eye, EyeOff, Headphones, Lock, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useSyncExternalStore, type FormEvent } from 'react'
import { mutate } from 'swr'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input } from '@/components/ui/Field'
import { useI18n } from '@/i18n/I18nProvider'
import { DATA_MODE } from '@/lib/api/client'
import { SUPPORT } from '@/services/announcements'
import { login } from '@/services/auth'
import s from './login.module.css'

/** "Remember me" only remembers the email on this device; the session itself is the backend's cookie. */
const REMEMBER_KEY = 'sf.login.email'

function readSavedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

// Static HTML has no saved email; the client snapshot fills it in after hydration.
function useSavedEmail() {
  return useSyncExternalStore(() => () => {}, readSavedEmail, () => '')
}

function LoginForm({ savedEmail }: { savedEmail: string }) {
  const { t, lang, setLang } = useI18n()
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(savedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(!!savedEmail)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      await login(email, password)
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email)
        else localStorage.removeItem(REMEMBER_KEY)
      } catch {}
      await mutate('me', undefined, { revalidate: true })
      const next = params.get('next')
      router.replace(next && next.startsWith('/') ? next : '/dashboard')
    } catch {
      setError(t('account.login.invalid'))
    } finally {
      setBusy(false)
    }
  }

  const tel = `tel:${SUPPORT.phone.replace(/[^\d+]/g, '')}`

  return (
    <form className={s.card} onSubmit={submit}>
      <div className={s.brand}>
        <LogoMark className={s.mark} />
        <span>
          SMALL <b>FREIGHT</b>
        </span>
      </div>
      <div className={s.heading}>
        <h1 className={s.title}>{t('account.login.title')}</h1>
        <p className={s.subtitle}>{t('account.login.subtitle')}</p>
      </div>
      <Field label={t('account.login.email')} htmlFor="login-email">
        <Input id="login-email" className={s.input} type="email" autoComplete="email" required leading={<Mail size={18} />} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t('account.login.password')} htmlFor="login-password" error={error}>
        <Input
          id="login-password"
          className={s.input}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          leading={<Lock size={18} />}
          trailing={
            <button type="button" className={s.eye} onClick={() => setShowPassword((v) => !v)} aria-label={t(showPassword ? 'account.login.hidePassword' : 'account.login.showPassword')} aria-pressed={showPassword}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={!!error}
        />
      </Field>
      <div className={s.row}>
        <Checkbox label={t('account.login.remember')} checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <button type="button" className={s.forgot} onClick={() => setShowForgot((v) => !v)} aria-expanded={showForgot}>
          {t('account.login.forgot')}
        </button>
      </div>
      {showForgot && (
        <p className={s.notice} role="status">
          {t('account.login.forgotHint')} <a href={tel}>{SUPPORT.phone}</a>
        </p>
      )}
      <Button type="submit" size="lg" block loading={busy} className={s.submit} trailing={busy ? undefined : <ArrowRight size={18} />}>
        {t('account.login.submit')}
      </Button>
      {DATA_MODE === 'mock' && <p className={s.demo}>{t('account.login.demo')}</p>}
      <div className={s.divider}>
        <span>{t('account.login.needHelp')}</span>
      </div>
      <a className={s.support} href={tel}>
        <Headphones size={18} />
        {t('account.login.contactSupport')}
      </a>
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

function Welcome() {
  const { t } = useI18n()
  return (
    <section className={s.hero}>
      <div className={s.heroText}>
        <h2 className={s.welcome}>
          {t('account.login.welcome')}
          <br />
          SMALL <span>FREIGHT</span>
        </h2>
        <p className={s.tagline}>{t('account.login.tagline')}</p>
      </div>
    </section>
  )
}

export default function LoginPage() {
  const savedEmail = useSavedEmail()
  return (
    <div className={s.page}>
      <Suspense>
        <Welcome />
        <main className={s.panel}>
          <LoginForm key={savedEmail} savedEmail={savedEmail} />
        </main>
      </Suspense>
    </div>
  )
}
