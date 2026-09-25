'use client'

import { useMemo, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { RawUserConfig } from '@/domain/raw'
import { useMe } from '@/hooks/useData'
import { useI18n } from '@/i18n/I18nProvider'
import { saveUserConfig } from '@/services/auth'
import { COLUMN_IDS, type ColumnId } from './columns'

export interface ColumnSetting {
  id: ColumnId
  visible: boolean
}

const isColumnId = (id: string): id is ColumnId => (COLUMN_IDS as readonly string[]).includes(id)

/** Normalise the saved config: keep saved order/visibility, append columns the config doesn't know yet. */
function normalise(cfg?: RawUserConfig): ColumnSetting[] {
  const saved = (cfg?.cargoTable?.columns ?? []).filter((c): c is ColumnSetting => isColumnId(c.id))
  const known = new Set(saved.map((c) => c.id))
  return [...saved, ...COLUMN_IDS.filter((id) => !known.has(id)).map((id) => ({ id, visible: true }))]
}

/** Column visibility persisted to /api/user-config, same record the old Booking page used. */
export function useColumnConfig() {
  const { t } = useI18n()
  const toast = useToast()
  const { data: me, mutate } = useMe()
  const [local, setLocal] = useState<ColumnSetting[] | null>(null)
  const columns = useMemo(() => local ?? normalise(me?.userConfig), [local, me])

  const toggle = async (id: ColumnId) => {
    const next = columns.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    if (!next.some((c) => c.visible)) return // keep at least one column
    setLocal(next)
    const cfg: RawUserConfig = { ...(me?.userConfig ?? {}), cargoTable: { columns: next } }
    try {
      await saveUserConfig(cfg)
      if (me) void mutate({ ...me, userConfig: cfg }, { revalidate: false })
    } catch {
      toast(t('shipments.my.columnsSaveFailed'), 'error')
    }
  }

  return { columns, visible: columns.filter((c) => c.visible).map((c) => c.id), toggle }
}
