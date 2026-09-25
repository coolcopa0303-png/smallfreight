'use client'

import { FileText, Home, Menu as MenuIcon, Search, Truck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Drawer } from '@/components/ui/Overlay'
import { useI18n } from '@/i18n/I18nProvider'
import { isActive, NAV } from './nav'
import s from './shell.module.css'

// Bottom navigation: max 5 top-level entries (spec §13 <768px).
const PRIMARY = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: Home },
  { href: '/shipments', labelKey: 'nav.shipmentTracking', icon: Truck },
  { href: '/quotes/ltl', labelKey: 'nav.getQuote', icon: FileText, prefix: '/quotes' },
  { href: '/hts', labelKey: 'nav.htsSearch', icon: Search },
]

export function MobileTabBar() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [more, setMore] = useState(false)
  const primaryActive = PRIMARY.some((p) => pathname.startsWith(p.prefix ?? p.href))
  return (
    <>
      <nav className={s.tabbar} aria-label={t('nav.menu')}>
        {PRIMARY.map((p) => {
          const Icon = p.icon
          const active = pathname.startsWith(p.prefix ?? p.href) && !(p.href === '/shipments' && pathname !== '/shipments')
          return (
            <Link key={p.href} href={p.href} className={s.tab} aria-current={active ? 'page' : undefined}>
              <Icon size={21} aria-hidden />
              {t(p.labelKey)}
            </Link>
          )
        })}
        <button type="button" className={s.tab} aria-current={!primaryActive ? 'page' : undefined} onClick={() => setMore(true)}>
          <MenuIcon size={21} aria-hidden />
          {t('common.actions.more')}
        </button>
      </nav>
      <Drawer open={more} onClose={() => setMore(false)} title={t('nav.menu')}>
        <div className={s.sheetNav}>
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={s.sheetItem} aria-current={isActive(item, pathname) ? 'page' : undefined} onClick={() => setMore(false)}>
                <Icon size={20} aria-hidden />
                {t(item.labelKey)}
              </Link>
            )
          })}
        </div>
      </Drawer>
    </>
  )
}
