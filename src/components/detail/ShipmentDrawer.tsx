'use client'

import { ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { lfdLevel } from '@/adapters/shipmentAdapter'
import { Select } from '@/components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import type { ReleaseState, Shipment } from '@/domain/types'
import { useShipment } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { DASH, serviceType } from './helpers'
import { MilestoneTimeline } from './MilestoneTimeline'
import { RouteMapArea } from './RoutePanel'
import s from './drawer.module.css'

// ---------- open/close plumbing ----------
interface DrawerApi {
  open: (id: string) => void
  /** Props for an <a> that opens the drawer on a plain click; ctrl/cmd/middle click still opens the full page. */
  linkProps: (id: string) => { href: string; onClick: (e: MouseEvent) => void }
}

const Ctx = createContext<DrawerApi | null>(null)

export function useShipmentDrawer(): DrawerApi {
  const api = useContext(Ctx)
  if (!api) throw new Error('useShipmentDrawer must be used inside <ShipmentDrawerProvider>')
  return api
}

/** Slide-in shipment detail (old Booking drawer layout + route map). Mounted once in the portal shell. */
export function ShipmentDrawerProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  const open = useCallback((next: string) => {
    setClosing(false)
    setId(next)
  }, [])
  const close = useCallback(() => setClosing(true), [])
  const linkProps = useCallback(
    (sid: string) => ({
      href: `/shipments/${sid}`,
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        open(sid)
      },
    }),
    [open],
  )

  return (
    <Ctx.Provider value={{ open, linkProps }}>
      {children}
      {id && <DrawerPanel id={id} closing={closing} onClose={close} onClosed={() => { setId(null); setClosing(false) }} />}
    </Ctx.Provider>
  )
}

function DrawerPanel({ id, closing, onClose, onClosed }: { id: string; closing: boolean; onClose: () => void; onClosed: () => void }) {
  const { t } = useI18n()
  const { shipment, isLoading, error, mutate } = useShipment(id)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
  }, [onClose])

  // Unmount once the slide-out animation finishes (reduced-motion users get no animation, so close at once).
  useEffect(() => {
    if (!closing) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onClosed()
  }, [closing, onClosed])

  if (typeof document === 'undefined') return null
  return createPortal(
    <>
      <div className={s.overlay} data-closing={closing || undefined} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        className={s.panel}
        data-closing={closing || undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shipment-drawer-title"
        tabIndex={-1}
        onAnimationEnd={(e) => closing && e.target === e.currentTarget && onClosed()}
      >
        <header className={s.head}>
          <h2 id="shipment-drawer-title" className={`${s.title} mono`}>
            {shipment?.smNumber ?? id}
          </h2>
          <Link href={`/shipments/${id}`} className={s.iconBtn} title={t('detail.drawer.openPage')} aria-label={t('detail.drawer.openPage')}>
            <ExternalLink size={17} />
          </Link>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label={t('detail.drawer.close')}>
            <X size={20} />
          </button>
        </header>
        <div className={s.scroll}>
          {shipment ? (
            <DrawerBody sh={shipment} />
          ) : isLoading ? (
            <div className={s.loading}>
              <Skeleton height={110} />
              <Skeleton height={320} />
            </div>
          ) : error ? (
            <ErrorState title={t('detail.error')} onRetry={mutate} />
          ) : (
            <EmptyState title={t('detail.notFound.title')} body={t('detail.notFound.body', { id })} />
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

// ---------- body ----------
const RELEASE_KEY: Record<ReleaseState, string> = { released: 'released', notReleased: 'notReleased', na: 'na' }

function Field({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
  const empty = value === undefined || value === null || value === ''
  return (
    <div className={s.field}>
      <dt className={s.fieldLabel}>{label}:</dt>
      <dd className={`${s.fieldValue} ${mono ? 'mono' : ''} ${empty ? s.muted : ''}`}>{empty ? '' : value}</dd>
    </div>
  )
}

function DrawerBody({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  return (
    <div className={s.body}>
      <MilestoneTimeline shipment={sh} />
      <div className={s.grid}>
        <dl className={s.fields}>
          <Field label={t('detail.drawer.mbl')} value={sh.mbl} mono />
          <Field label={t('detail.drawer.hbl')} value={sh.hbl} mono />
          <Field label={t('detail.drawer.cntr')} value={sh.containers.join(', ')} mono />
          <Field label={t('detail.drawer.ref')} value={sh.reference} />
          <Field label={t('detail.drawer.eta')} value={sh.eta?.slice(0, 10)} />
          <Field label={t('detail.drawer.isf')} value={sh.isf.state === 'na' ? undefined : t(`status.isf.${sh.isf.state}`)} />
          <Field label={t('detail.drawer.pga')} value={sh.pgaStatus} />
          <Field label={t('detail.drawer.customs')} value={t(`status.release.${RELEASE_KEY[sh.customsRelease]}`)} />
          <Field label={t('detail.drawer.freight')} value={t(`status.release.${RELEASE_KEY[sh.freightRelease]}`)} />
        </dl>

        <ContainerDates sh={sh} />

        <dl className={`${s.fields} ${s.extra}`}>
          <Field label={t('detail.drawer.serviceType')} value={<span className={s.chip}>{serviceType(sh, t)}</span>} />
          <Field label={t('detail.drawer.document')} />
        </dl>

        <div className={s.map}>
          <RouteMapArea shipment={sh} />
        </div>

        <Updates sh={sh} />
      </div>
    </div>
  )
}

/** "Time Zone" column of the old drawer: per-container key dates, switchable by CNTR. */
function ContainerDates({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  const [cntr, setCntr] = useState(sh.containerInfo[0]?.number ?? '')
  const info = sh.containerInfo.find((c) => c.number === cntr)
  const level = lfdLevel(info?.lfd)
  const rows: [string, string | undefined, string?][] = [
    ['lfd', info?.lfd, info?.pickupDate ? undefined : level],
    ['pickup', info?.pickupDate],
    ['delivery', info?.deliverDate],
    ['emptyReturn', info?.emptyReturnDate],
    ['emptyNotification', info?.emptyNotificationDate],
  ]
  return (
    <section className={s.dates} aria-labelledby="drawer-tz">
      <h3 id="drawer-tz" className={s.datesTitle}>{t('detail.drawer.timeZone')}</h3>
      {sh.containerInfo.length > 0 ? (
        <Select
          className={s.cntrSelect}
          aria-label={t('detail.drawer.cntr')}
          value={cntr}
          onChange={(e) => setCntr(e.target.value)}
          options={sh.containerInfo.map((c) => ({ value: c.number, label: c.number }))}
        />
      ) : (
        <p className={s.muted}>{t('detail.drawer.noContainers')}</p>
      )}
      <dl className={s.dateList}>
        {rows.map(([key, value, lfd]) => (
          <div key={key} className={s.dateRow} data-lfd={lfd}>
            <dt>{t(`detail.drawer.${key}`)}</dt>
            <dd className="tnum">{value?.slice(0, 10) ?? '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Updates({ sh }: { sh: Shipment }) {
  const { t } = useI18n()
  return (
    <section className={s.updates} aria-labelledby="drawer-upd">
      <h3 id="drawer-upd" className={s.updTitle}>{t('detail.drawer.update')}</h3>
      {sh.events.length === 0 ? (
        <p className={s.muted}>{DASH}</p>
      ) : (
        <ul className={s.updList}>
          {sh.events.map((e, i) => (
            <li key={`${e.time}-${i}`}>
              <time className={`${s.updDate} tnum`} dateTime={e.time}>{e.time.slice(5, 10)}</time>
              <p className={s.updText}>{e.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
