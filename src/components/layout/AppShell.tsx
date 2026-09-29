'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useMe } from '@/hooks/useData'
import { ApiError, UNAUTHORIZED_EVENT } from '@/lib/api/client'
import { GlobalHeader } from './GlobalHeader'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'
import s from './shell.module.css'

const COLLAPSE_KEY = 'sf-sidebar-collapsed'

/** Unified shell for every portal page (spec §0.3-5): navy sidebar + white header + cool-gray canvas. */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { error } = useMe()
  const [collapsed, setCollapsed] = useState(false)

  // Read after mount so the static HTML (always expanded) hydrates cleanly.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {
      // storage unavailable — stay expanded
    }
  }, [])

  const toggleSidebar = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        // ignore
      }
      return !c
    })
  }

  useEffect(() => {
    const toLogin = () => router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    if (error instanceof ApiError && error.status === 401) toLogin()
    window.addEventListener(UNAUTHORIZED_EVENT, toLogin)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, toLogin)
  }, [error, router, pathname])

  return (
    <div className={s.shell} data-collapsed={collapsed || undefined}>
      <Sidebar />
      <div className={s.main}>
        <GlobalHeader sidebarCollapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main id="main" className={s.content}>
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
