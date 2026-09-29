'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { useMe } from '@/hooks/useData'
import { ApiError, UNAUTHORIZED_EVENT } from '@/lib/api/client'
import { GlobalHeader } from './GlobalHeader'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'
import s from './shell.module.css'

const COLLAPSE_KEY = 'sf-sidebar-collapsed'
const COLLAPSE_EVENT = 'sf:sidebar-collapsed'

// Sidebar collapse lives in localStorage; the server snapshot (static HTML) is always expanded so hydration is clean.
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}
function subscribeCollapsed(cb: () => void) {
  window.addEventListener(COLLAPSE_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

/** Unified shell for every portal page (spec §0.3-5): navy sidebar + white header + cool-gray canvas. */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { error } = useMe()
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false)

  const toggleSidebar = () => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '0' : '1')
    } catch {
      // storage unavailable — the toggle won't stick
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT))
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
