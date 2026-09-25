'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/i18n/I18nProvider'
import { LogoMark } from './Logo'
import { isActive, NAV } from './nav'
import s from './shell.module.css'

export function Sidebar() {
  const { t } = useI18n()
  const pathname = usePathname()
  return (
    <aside className={s.sidebar} aria-label={t('nav.menu')}>
      <div className={s.sidebarArt} aria-hidden />
      <Link href="/dashboard" className={s.logo} aria-label="SMALL FREIGHT — Dashboard">
        <LogoMark className={s.logoMark} />
        <span className={s.logoText}>
          SMALL <span>FREIGHT</span>
        </span>
      </Link>
      <nav className={s.nav}>
        {NAV.map((item) => {
          const active = isActive(item, pathname)
          const Icon = item.icon
          return (
            <div key={item.href} style={{ display: 'contents' }}>
              <Link
                href={item.href}
                className={s.navItem}
                aria-current={active && !item.children ? 'page' : undefined}
                data-active={active || undefined}
                title={t(item.labelKey)}
              >
                <Icon size={21} aria-hidden />
                <span className={s.navLabel}>{t(item.labelKey)}</span>
              </Link>
              {item.children && active && (
                <div className={s.subNav}>
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} className={s.subItem} aria-current={pathname === c.href ? 'page' : undefined}>
                      {t(c.labelKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <p className={s.tagline}>{t('common.brand.tagline')}</p>
    </aside>
  )
}
