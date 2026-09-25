'use client'

import { AlertTriangle, BellRing, Clock } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { useShipments, useWatchlist } from '@/hooks/useData'
import { fmtDate, fmtRelative } from '@/i18n/format'
import { useI18n } from '@/i18n/I18nProvider'
import s from './shell.module.css'

interface Notice {
  id: string
  shipmentId: string
  smNumber: string
  kind: 'lfdSoon' | 'lfdPast' | 'isfBillNotOnFile' | 'urgent' | 'tracked'
  text: string
  time?: string
}

const READ_KEY = 'sf-notif-read'
const subs = new Set<() => void>()
let readCache: string | null = null
const readRaw = () => {
  if (readCache === null) {
    try {
      readCache = localStorage.getItem(READ_KEY) ?? '[]'
    } catch {
      readCache = '[]'
    }
  }
  return readCache
}

/** Derived from shipment data: LFD / ISF / urgent alerts + recent events on tracked shipments. */
export function useNotifications() {
  const { data } = useShipments()
  const { list: watched } = useWatchlist()
  const { t, lang } = useI18n()
  // Captured once per mount so the derived list stays pure across re-renders.
  const [weekAgo] = useState(() => Date.now() - 7 * 86400000)
  const readJson = useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    readRaw,
    () => '[]',
  )
  const read = useMemo(() => new Set<string>(JSON.parse(readJson)), [readJson])

  const items = useMemo<Notice[]>(() => {
    if (!data) return []
    const out: Notice[] = []
    for (const sh of data) {
      for (const a of sh.alerts) {
        out.push({
          id: `${sh.id}:${a.kind}:${a.date ?? ''}`,
          shipmentId: sh.id,
          smNumber: sh.smNumber,
          kind: a.kind,
          text: t(`status.alerts.${a.kind}`, { date: fmtDate(a.date, lang) }),
          time: a.date,
        })
      }
      if (watched.includes(sh.id) && sh.lastUpdated && Date.parse(sh.lastUpdated) > weekAgo) {
        out.push({ id: `${sh.id}:ev:${sh.lastUpdated}`, shipmentId: sh.id, smNumber: sh.smNumber, kind: 'tracked', text: sh.lastEvent ?? '', time: sh.lastUpdated })
      }
    }
    return out.slice(0, 30)
  }, [data, watched, t, lang, weekAgo])

  const markAllRead = () => {
    const next = JSON.stringify(Array.from(new Set([...read, ...items.map((i) => i.id)])))
    readCache = next
    try {
      localStorage.setItem(READ_KEY, next)
    } catch {
      // ignore
    }
    subs.forEach((f) => f())
  }

  return { items, read, unread: items.filter((i) => !read.has(i.id)).length, markAllRead }
}

export function NotificationsPanel({ items, read, markAllRead, onNavigate }: ReturnType<typeof useNotifications> & { onNavigate: () => void }) {
  const { t, lang } = useI18n()
  return (
    <div className={s.notif}>
      <div className={s.notifHead}>
        <span>{t('account.notifications.title')}</span>
        {items.length > 0 && (
          <button type="button" onClick={markAllRead} style={{ border: 0, background: 'none', color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600 }}>
            {t('account.notifications.markAllRead')}
          </button>
        )}
      </div>
      {items.length === 0 && <p style={{ padding: '16px 10px', color: 'var(--text-muted)' }}>{t('account.notifications.empty')}</p>}
      {items.map((n) => {
        const danger = n.kind === 'lfdPast' || n.kind === 'urgent' || n.kind === 'isfBillNotOnFile'
        const Icon = n.kind === 'tracked' ? BellRing : danger ? AlertTriangle : Clock
        return (
          <Link
            key={n.id}
            href={`/shipments/${n.shipmentId}`}
            role="menuitem"
            className={`${s.notifItem} ${read.has(n.id) ? '' : s.notifUnread}`}
            onClick={onNavigate}
          >
            <span
              className={s.notifIcon}
              style={{
                background: danger ? 'var(--danger-soft)' : n.kind === 'tracked' ? 'var(--brand-primary-soft)' : 'var(--warning-soft)',
                color: danger ? 'var(--danger)' : n.kind === 'tracked' ? 'var(--brand-primary)' : 'var(--warning-strong)',
              }}
            >
              <Icon size={15} />
            </span>
            <span>
              <strong className="mono">{n.smNumber}</strong> — {n.kind === 'tracked' ? t('account.notifications.tracked') + ': ' : ''}
              {n.text}
              {n.time && n.kind === 'tracked' && <span className={s.notifMeta}> · {fmtRelative(n.time, lang)}</span>}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
