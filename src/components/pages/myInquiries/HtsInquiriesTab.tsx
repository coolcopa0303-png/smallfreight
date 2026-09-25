'use client'

import { CheckCircle2, ChevronRight, Clock, MessageSquarePlus, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { AskTeamModal } from '@/components/hts/AskTeamModal'
import { inquiryAnswerCode } from '@/components/hts/htsUtils'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/Field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Badge } from '@/components/ui/StatusChip'
import { Pagination } from '@/components/ui/misc'
import { useI18n } from '@/i18n/I18nProvider'
import { fmtIsoDate } from '@/i18n/format'
import { fetchHtsInquiries } from '@/services/hts'
import { HtsInquiryDrawer } from './HtsInquiryDrawer'
import s from './inquiries.module.css'

const PAGE_SIZE = 20

export function HtsInquiriesTab() {
  const { t } = useI18n()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // URL page is 1-based for people; the API page is 0-based.
  const page = Math.max(0, Number(params.get('page') ?? '1') - 1 || 0)
  const [text, setText] = useState('')
  const [keyword, setKeyword] = useState('')
  const [myOnly, setMyOnly] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [asking, setAsking] = useState(false)

  const setPage = (p: number) => {
    const next = new URLSearchParams(params.toString())
    if (p > 0) next.set('page', String(p + 1))
    else next.delete('page')
    router.replace(`${pathname}?${next}`, { scroll: false })
  }

  useEffect(() => {
    const id = setTimeout(() => setKeyword(text.trim()), 300)
    return () => clearTimeout(id)
  }, [text])

  const { data, error, isLoading, mutate } = useSWR(['hts-inquiries', keyword, page, myOnly], () => fetchHtsInquiries({ keyword, page, myOnly }), { keepPreviousData: true })

  const resetPage = () => page > 0 && setPage(0)

  return (
    <div className={s.stack}>
      <div className={s.toolbar}>
        <Input
          className={s.search}
          leading={<Search size={17} />}
          value={text}
          placeholder={t('inquiries.hts.search')}
          aria-label={t('inquiries.hts.search')}
          onChange={(e) => {
            setText(e.target.value)
            resetPage()
          }}
          onClear={() => setText('')}
        />
        <Checkbox
          label={t('inquiries.hts.myOnly')}
          checked={myOnly}
          onChange={(e) => {
            setMyOnly(e.target.checked)
            resetPage()
          }}
        />
        <Button className={s.toolbarEnd} leading={<MessageSquarePlus size={17} />} onClick={() => setAsking(true)}>
          {t('inquiries.hts.ask')}
        </Button>
      </div>

      {error ? (
        <ErrorState title={t('inquiries.hts.errorTitle')} detail={(error as Error).message} onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <ul className={s.list} aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className={s.rowSkeleton}>
              <Skeleton width="38%" height={16} />
              <Skeleton width="62%" height={12} />
            </li>
          ))}
        </ul>
      ) : !data?.items.length ? (
        <EmptyState
          title={myOnly && !keyword ? t('inquiries.hts.emptyMineTitle') : t('inquiries.hts.emptyTitle')}
          body={myOnly && !keyword ? t('inquiries.hts.emptyMineBody') : t('inquiries.hts.emptyBody')}
          action={
            <Button leading={<MessageSquarePlus size={17} />} onClick={() => setAsking(true)}>
              {t('inquiries.hts.ask')}
            </Button>
          }
        />
      ) : (
        <>
          <ul className={s.list}>
            {data.items.map((q) => {
              const code = inquiryAnswerCode(q)
              const answered = !!(q.answeredBy || code)
              return (
                <li key={q.id}>
                  <button type="button" className={s.row} onClick={() => setOpenId(q.id)} aria-label={t('inquiries.hts.open', { name: q.productName })}>
                    <span className={s.rowMain}>
                      <span className={s.rowTitle}>
                        {q.productName}
                        {q.productNameZh && <span className={s.rowZh}>{q.productNameZh}</span>}
                        {q.mine && <Badge tone="blue">{t('inquiries.hts.mine')}</Badge>}
                      </span>
                      <span className={s.rowMeta}>
                        {q.material && (
                          <span>
                            {t('inquiries.hts.material')}: {q.material}
                          </span>
                        )}
                        {q.description && <span className={s.rowDesc}>{q.description}</span>}
                      </span>
                    </span>
                    <span className={s.rowSide}>
                      {code ? (
                        <span className={s.answerCode}>{code}{q.answer?.duty ? ` · ${q.answer.duty}` : ''}</span>
                      ) : (
                        <span className={answered ? s.stateDone : s.statePending}>
                          {answered ? <CheckCircle2 size={14} aria-hidden /> : <Clock size={14} aria-hidden />}
                          {answered ? t('inquiries.hts.answered') : t('inquiries.hts.awaiting')}
                        </span>
                      )}
                      <span className={s.rowSub}>
                        {q.answeredBy ? t('inquiries.hts.answeredBy', { name: q.answeredBy }) + ' · ' : ''}
                        <span className="tnum">{fmtIsoDate(q.createdAt)}</span>
                      </span>
                    </span>
                    <ChevronRight size={18} className={s.chev} aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.count} onPage={setPage} />
        </>
      )}

      {openId !== null && <HtsInquiryDrawer id={openId} onClose={() => setOpenId(null)} />}
      {asking && <AskTeamModal open onClose={() => setAsking(false)} onSent={() => mutate()} />}
    </div>
  )
}
