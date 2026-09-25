'use client'

import { Bell, BellRing, ChevronDown, Download, FileSpreadsheet, Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { useToast } from '@/components/ui/Toast'
import type { Shipment } from '@/domain/types'
import { STATUS_META } from '@/domain/statusMap'
import { useWatchlist } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtIsoDate } from '@/i18n/format'
import { DASH, downloadBlob, serviceType, toCsv } from './helpers'
import s from './detail.module.css'

export function DetailActions({ shipment: sh }: { shipment: Shipment }) {
  const { t } = useI18n()
  const toast = useToast()
  const { isWatched, toggle } = useWatchlist()
  const watched = isWatched(sh.id)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast(t('detail.actions.linkCopied'))
    } catch {
      toast(t('common.states.error'), 'error')
    }
  }

  const csv = () => {
    const place = (p?: Shipment['origin']) => (p ? [p.city, p.countryCode, p.portName].filter(Boolean).join(', ') : '')
    const c = sh.cargo
    const rows: [string, string][] = [
      [t('detail.csv.field'), t('detail.csv.value')],
      [t('detail.details.shipmentNumber'), sh.smNumber],
      [t('detail.details.bl'), sh.mbl ?? ''],
      [t('detail.details.hbl'), sh.hbl ?? ''],
      [t('detail.details.containers'), sh.containers.join(' ')],
      [t('detail.details.reference'), sh.reference ?? ''],
      [t('detail.details.isf'), sh.isfNumber ?? ''],
      [t('detail.details.serviceType'), serviceType(sh, t)],
      [t('detail.csv.status'), sh.completed ? t('status.completed') : t(STATUS_META[sh.status].labelKey)],
      [t('detail.csv.origin'), place(sh.origin)],
      [t('detail.csv.destination'), place(sh.destination)],
      [t('detail.csv.etd'), sh.etd ? fmtIsoDate(sh.etd) : ''],
      [t('detail.csv.eta'), sh.eta ? fmtIsoDate(sh.eta) : ''],
      [t('detail.details.shipper'), sh.shipper ?? ''],
      [t('detail.details.consignee'), sh.consignee ?? ''],
      [t('detail.details.deliverTo'), sh.deliverTo ?? ''],
      [t('detail.cargo.description'), c?.description ?? ''],
      [t('detail.cargo.hsCode'), c?.hsCode ?? ''],
      [t('detail.cargo.packages'), c?.packages ?? ''],
      [t('detail.cargo.weight'), c?.weightKg !== undefined ? `${c.weightKg} KGS` : ''],
      [t('detail.cargo.volume'), c?.volumeCbm !== undefined ? `${c.volumeCbm} CBM` : ''],
      [t('detail.cargo.containerType'), c?.containerType ?? ''],
      [t('detail.cargo.seal'), c?.sealNumber ?? ''],
      [t('detail.csv.lastEvent'), sh.lastEvent ? `${sh.lastEvent} (${sh.lastUpdated ?? DASH})` : ''],
    ]
    downloadBlob(toCsv(rows), `${sh.smNumber}.csv`)
    toast(t('detail.actions.csvReady'))
  }

  const track = () => {
    toggle(sh.id)
    toast(t(watched ? 'detail.actions.trackOff' : 'detail.actions.trackOn', { sm: sh.smNumber }), watched ? 'info' : 'success')
  }

  return (
    <div className={s.actions}>
      <Button variant="secondary" className={s.actionBtn} leading={<Share2 size={18} />} onClick={share}>
        {t('detail.actions.share')}
      </Button>
      <div className={s.split}>
        <Button variant="secondary" className={`${s.actionBtn} ${s.splitMain}`} leading={<Download size={18} />} onClick={csv}>
          {t('detail.actions.download')}
        </Button>
        <Menu
          label={t('detail.actions.downloadOptions')}
          width={240}
          trigger={(p) => (
            <Button variant="secondary" iconOnly className={`${s.actionBtn} ${s.splitToggle}`} aria-label={t('detail.actions.downloadOptions')} {...p}>
              <ChevronDown size={18} />
            </Button>
          )}
        >
          {(close) => (
            <>
              <MenuItem
                icon={<FileSpreadsheet size={16} aria-hidden />}
                onSelect={() => {
                  close()
                  csv()
                }}
              >
                {t('detail.actions.csv')}
              </MenuItem>
              <MenuItem
                icon={<Printer size={16} aria-hidden />}
                onSelect={() => {
                  close()
                  window.print()
                }}
              >
                {t('detail.actions.print')}
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
      <Button
        variant="primary"
        className={`${s.actionBtn} ${s.trackBtn}`}
        leading={watched ? <BellRing size={18} /> : <Bell size={18} />}
        aria-pressed={watched}
        onClick={track}
      >
        {watched ? `${t('detail.actions.tracking')} ✓` : t('detail.actions.track')}
      </Button>
    </div>
  )
}
