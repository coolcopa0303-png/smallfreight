'use client'

import { Flag } from '@/components/ui/misc'
import type { Place } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import s from './shipment.module.css'

/** Flag + city (primary) + "CC, PORT" (secondary). Missing data renders a neutral placeholder, not a fake place. */
export function FlagLocation({ place, flagWidth = 22, sub = 'code' }: { place?: Place; flagWidth?: number; sub?: 'code' | 'port' | 'none' }) {
  const { t } = useI18n()
  if (!place) {
    return (
      <span className={s.place}>
        <span className={`${s.placeCity} ${s.unknown}`}>{t('common.states.none')}</span>
      </span>
    )
  }
  const code = place.portCode ? place.portCode.slice(2) : undefined
  const subText = sub === 'port' ? place.portName : sub === 'code' ? [place.countryCode, code].filter(Boolean).join(', ') : undefined
  return (
    <span className={s.place}>
      <Flag code={place.countryCode} width={flagWidth} />
      <span className={s.placeText}>
        <span className={s.placeCity}>{place.city}</span>
        {subText && <span className={s.placeSub}>{subText}</span>}
      </span>
    </span>
  )
}
