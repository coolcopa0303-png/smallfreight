'use client'

import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { I18nProvider } from '@/i18n/I18nProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  )
}
