'use client'

import { Calculator, ExternalLink, Trash2 } from 'lucide-react'
import { useSavedCalcs } from '@/components/hts/savedCalcs'
import { fmtRate } from '@/components/hts/htsUtils'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import { Flag } from '@/components/ui/misc'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDate, fmtMoney } from '@/i18n/format'
import s from './inquiries.module.css'

/** Duty estimates saved from /hts (localStorage `sf-saved-hts`). */
export function SavedCalcsTab() {
  const { t, lang } = useI18n()
  const toast = useToast()
  const { list, remove } = useSavedCalcs()

  if (!list.length)
    return (
      <EmptyState
        icon={<Calculator size={22} />}
        title={t('inquiries.saved.emptyTitle')}
        body={t('inquiries.saved.emptyBody')}
        action={<ButtonLink href="/hts">{t('inquiries.saved.emptyCta')}</ButtonLink>}
      />
    )

  return (
    <div className={s.stack}>
      <p className={s.muted}>{t('inquiries.saved.intro')}</p>
      <ul className={s.savedGrid}>
        {list.map((c) => (
          <li key={c.id} className={s.saved}>
            <div className={s.savedHead}>
              <span className={s.answerCodeLg}>{c.htsCode}</span>
              <span className={s.rowSub}>
                {t('inquiries.saved.savedOn')} <span className="tnum">{fmtDate(c.savedAt, lang)}</span>
              </span>
            </div>
            <p className={s.savedDesc} title={c.description}>{c.description}</p>
            <dl className={s.savedFacts}>
              <div><dt>{t('inquiries.saved.value')}</dt><dd>{fmtMoney(c.value, lang)}</dd></div>
              <div><dt>{t('inquiries.saved.dutyRate')}</dt><dd className={s.savedRate}>{fmtRate(c.dutyRatePct)}</dd></div>
              <div><dt>{t('inquiries.saved.totalDuties')}</dt><dd>{fmtMoney(c.totalDuties, lang)}</dd></div>
              <div><dt>{t('inquiries.saved.landedCost')}</dt><dd className={s.savedLanded}>{fmtMoney(c.landedCost, lang)}</dd></div>
            </dl>
            <div className={s.savedMeta}>
              <span className={s.origin}>
                <Flag code={c.origin} width={18} /> {t(`common.mode.${c.mode}`)}
              </span>
              {c.additional.length > 0 && <span>{t('inquiries.saved.additional')}: {c.additional.join('; ')}</span>}
              {c.exclusions.length > 0 && <span>{t('inquiries.saved.exclusions')}: {c.exclusions.join(', ')}</span>}
            </div>
            <div className={s.savedActions}>
              <ButtonLink href={`/hts?q=${encodeURIComponent(c.htsCode)}`} variant="secondary" size="sm" leading={<ExternalLink size={15} />}>
                {t('inquiries.saved.open')}
              </ButtonLink>
              <Button
                variant="ghost"
                size="sm"
                leading={<Trash2 size={15} />}
                aria-label={t('inquiries.saved.removeLabel', { code: c.htsCode })}
                onClick={() => {
                  remove(c.id)
                  toast(t('inquiries.saved.removed'))
                }}
              >
                {t('inquiries.saved.remove')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
