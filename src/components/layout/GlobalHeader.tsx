'use client'

import { Bell, BookUser, ChevronDown, CircleHelp, KeyRound, Languages, LogOut, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { useMe } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { DATA_MODE } from '@/lib/api/client'
import { initials, logout } from '@/services/auth'
import { ChangePasswordModal } from './ChangePasswordModal'
import { NotificationsPanel, useNotifications } from './Notifications'
import s from './shell.module.css'

export function GlobalHeader({
  sidebarCollapsed,
  onToggleSidebar,
}: {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}) {
  const { t, lang, setLang } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  // The shipment search bar only lives on the Dashboard.
  const showSearch = pathname.startsWith('/dashboard')
  const { data: me } = useMe()
  const [q, setQ] = useState('')
  const [pwOpen, setPwOpen] = useState(false)
  const notifications = useNotifications()

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const v = q.trim()
    router.push(v ? `/shipments?q=${encodeURIComponent(v)}` : '/shipments')
  }

  const onLogout = async () => {
    try {
      await logout()
    } finally {
      router.replace('/login')
    }
  }

  return (
    <header className={s.header}>
      <button
        type="button"
        className={`${s.iconBtn} ${s.sidebarToggle}`}
        onClick={onToggleSidebar}
        aria-label={t(sidebarCollapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
        title={t(sidebarCollapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>
      {showSearch && (
        <form className={s.search} role="search" onSubmit={onSearch}>
          <label className={s.searchField}>
            <Search size={17} aria-hidden />
            <span className="sr-only">{t('common.search.global')}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search.global')} />
          </label>
          <button type="submit" className={s.searchBtn} aria-label={t('common.search.submit')}>
            <Search size={20} />
          </button>
        </form>
      )}

      <div className={s.headerRight}>
        {DATA_MODE === 'mock' && (
          <span className={`${s.sample} ${s.hideMobile}`} title={t('common.sampleDataHint')}>
            {t('common.sampleData')}
          </span>
        )}
        <Menu
          label={t('account.notifications.title')}
          trigger={(p) => (
            <button type="button" className={s.iconBtn} aria-label={t('nav.notifications')} {...p}>
              <Bell size={21} />
              {notifications.unread > 0 && <span className={s.dot} aria-hidden />}
            </button>
          )}
        >
          {(close) => <NotificationsPanel {...notifications} onNavigate={close} />}
        </Menu>
        <Link href="/help" className={`${s.iconBtn} ${s.hideMobile}`} aria-label={t('nav.help')}>
          <CircleHelp size={21} />
        </Link>
        <Menu
          label={t('common.language.label')}
          width={160}
          trigger={(p) => (
            <button type="button" className={s.iconBtn} aria-label={t('common.language.label')} {...p}>
              <Languages size={21} />
            </button>
          )}
        >
          {(close) => (
            <>
              {(['en', 'zh-CN'] as const).map((l) => (
                <MenuItem key={l} checked={lang === l} onSelect={() => { setLang(l); close() }}>
                  {t(`common.language.${l}`)}
                </MenuItem>
              ))}
            </>
          )}
        </Menu>
        <Menu
          label={t('nav.account')}
          width={240}
          trigger={(p) => (
            <button type="button" className={s.avatarBtn} aria-label={t('nav.account')} {...p}>
              <span className={s.avatar}>{initials(me?.user.email)}</span>
              <ChevronDown size={16} className={s.hideMobile} />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className={s.menuHead}>
                {t('account.signedInAs')}
                <strong>{me?.user.email ?? '—'}</strong>
              </div>
              <MenuSeparator />
              <MenuItem icon={<BookUser size={16} />} onSelect={() => { close(); router.push('/address-book') }}>
                {t('nav.addressBook')}
              </MenuItem>
              <MenuItem icon={<KeyRound size={16} />} onSelect={() => { close(); setPwOpen(true) }}>
                {t('account.changePassword')}
              </MenuItem>
              <MenuItem icon={<LogOut size={16} />} onSelect={onLogout}>
                {t('account.logout')}
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  )
}
