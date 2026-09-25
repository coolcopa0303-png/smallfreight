'use client'

import { Calculator, Sparkles, UserCheck } from 'lucide-react'
import useSWR from 'swr'
import { ButtonLink } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Overlay'
import { ErrorState, Skeleton } from '@/components/ui/States'
import type { HtsInquiry } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtDateTime } from '@/i18n/format'
import { fetchHtsInquiry } from '@/services/hts'
import { cleanCode } from '@/components/hts/htsUtils'
import s from './inquiries.module.css'

type Answer = NonNullable<HtsInquiry['answer']>
const usable = (a?: Answer) => !!a?.htsCode && /\d{4}/.test(a.htsCode)

function AnswerBlock({ answer, ai }: { answer: Answer; ai?: boolean }) {
  const { t } = useI18n()
  const code = cleanCode(answer.htsCode ?? '')
  return (
    <div className={ai ? `${s.answer} ${s.answerAi}` : s.answer}>
      <dl className={s.answerGrid}>
        <div>
          <dt>{t('inquiries.detail.htsCode')}</dt>
          <dd className={s.answerCodeLg}>{code}</dd>
        </div>
        {answer.duty && (
          <div>
            <dt>{t('inquiries.detail.duty')}</dt>
            <dd className="tnum">{answer.duty}</dd>
          </div>
        )}
      </dl>
      {answer.description && <p className={s.answerDesc}>{answer.description}</p>}
      <ButtonLink href={`/hts?q=${encodeURIComponent(code)}`} variant={ai ? 'neutral' : 'secondary'} size="sm" leading={<Calculator size={15} />}>
        {t('inquiries.detail.calculate')}
      </ButtonLink>
    </div>
  )
}

export function HtsInquiryDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const { t, lang } = useI18n()
  const { data: q, error, isLoading, mutate } = useSWR(['hts-inquiry', id], () => fetchHtsInquiry(id))

  return (
    <Drawer open onClose={onClose} title={q ? q.productName : t('inquiries.detail.title')} width={560}>
      {error ? (
        <ErrorState title={t('inquiries.detail.errorTitle')} detail={(error as Error).message} onRetry={() => mutate()} />
      ) : isLoading || !q ? (
        <div className={s.stack}>
          <Skeleton height={20} width="50%" />
          <Skeleton height={80} />
          <Skeleton height={120} />
        </div>
      ) : (
        <div className={s.stack}>
          <section>
            <h3 className={s.drawerH}>{t('inquiries.detail.question')}</h3>
            <dl className={s.facts}>
              <div><dt>{t('inquiries.detail.productName')}</dt><dd>{q.productName}</dd></div>
              {q.productNameZh && <div><dt>{t('inquiries.detail.productNameZh')}</dt><dd>{q.productNameZh}</dd></div>}
              {q.material && <div><dt>{t('inquiries.detail.material')}</dt><dd>{q.material}</dd></div>}
              {q.description && <div><dt>{t('inquiries.detail.description')}</dt><dd>{q.description}</dd></div>}
              <div><dt>{t('inquiries.detail.askedOn')}</dt><dd className="tnum">{fmtDateTime(q.createdAt, lang)}</dd></div>
            </dl>
          </section>

          <section>
            <h3 className={s.drawerH}>
              <UserCheck size={17} aria-hidden /> {t('inquiries.detail.answer')}
              {q.answeredBy && <span className={s.drawerHSub}>{t('inquiries.detail.answeredBy', { name: q.answeredBy })}</span>}
            </h3>
            {usable(q.answer) ? <AnswerBlock answer={q.answer!} /> : <p className={s.muted}>{t('inquiries.detail.noAnswer')}</p>}
          </section>

          {usable(q.aiAnswer) && (
            <section>
              <h3 className={s.drawerH}>
                <Sparkles size={17} aria-hidden /> {t('inquiries.detail.ai')}
              </h3>
              <p className={s.aiNote}>{t('inquiries.detail.aiNote')}</p>
              <AnswerBlock answer={q.aiAnswer!} ai />
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}
