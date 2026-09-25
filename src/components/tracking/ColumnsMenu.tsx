'use client'

import { Check, Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Menu, MenuItem } from '@/components/ui/Menu'
import { useI18n } from '@/i18n/I18nProvider'
import type { ColumnId } from './columns'
import type { ColumnSetting } from './useColumnConfig'
import s from './myShipments.module.css'

/** "Columns" dropdown — show/hide table columns (old "Columns Setting"). Stays open while toggling. */
export function ColumnsMenu({ columns, onToggle }: { columns: ColumnSetting[]; onToggle: (id: ColumnId) => void }) {
  const { t } = useI18n()
  const visibleCount = columns.filter((c) => c.visible).length
  return (
    <Menu
      label={t('shipments.my.columnsLabel')}
      width={240}
      trigger={(p) => (
        <Button variant="neutral" leading={<Columns3 size={16} />} {...p}>
          {t('shipments.my.columns')}
        </Button>
      )}
    >
      {() =>
        columns.map((c) => (
          <MenuItem key={c.id} multi checked={c.visible} onSelect={() => (c.visible && visibleCount === 1 ? undefined : onToggle(c.id))} icon={<span className={s.checkBox} data-on={c.visible || undefined} aria-hidden>{c.visible && <Check size={12} strokeWidth={3} />}</span>}>
            {t(`shipments.my.cols.${c.id}`)}
          </MenuItem>
        ))
      }
    </Menu>
  )
}
