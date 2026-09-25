'use client'

import { MessageSquareText, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import useSWR from 'swr'
import type { HtsInquiry, HtsItem } from '@/domain/types'
import { useI18n } from '@/i18n/I18nProvider'
import { fetchHtsInquiries, fetchHtsInquiry, searchHtsItems } from '@/services/hts'
import { useToast } from '@/components/ui/Toast'
import { cleanCode, inquiryAnswerCode, sameCode } from './htsUtils'
import s from './search.module.css'

type Option = { kind: 'hts'; item: HtsItem } | { kind: 'inq'; inq: HtsInquiry }

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

/** Product / HTS autocomplete (spec §10.3) — ARIA 1.2 combobox with a grouped listbox. */
export function HtsSearchInput({ id, value, onChange, initialQuery, invalid, describedBy }: {
  id: string
  value: HtsItem | null
  onChange: (item: HtsItem | null) => void
  initialQuery?: string
  invalid?: boolean
  describedBy?: string
}) {
  const { t, lang } = useI18n()
  const toast = useToast()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(value ? cleanCode(value.htsCode) : '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [resolving, setResolving] = useState<number | null>(null)
  const query = useDebounced(text.trim(), 250)
  const enabled = open && !value && query.length >= 2

  const hts = useSWR(enabled ? ['hts-items', query] : null, () => searchHtsItems(query), { keepPreviousData: true, revalidateOnFocus: false })
  const inq = useSWR(enabled ? ['hts-inq-suggest', query] : null, () => fetchHtsInquiries({ keyword: query }), { keepPreviousData: true, revalidateOnFocus: false })

  // Code-like queries lead with HTS codes; product keywords lead with past broker answers.
  const codeLike = /^[\d.\s]+$/.test(query)
  const groups = useMemo(() => {
    if (!enabled) return []
    const seen = new Set<string>()
    const items: Option[] = (hts.data ?? [])
      .filter((i) => {
        const k = cleanCode(i.htsCode)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .slice(0, codeLike ? 7 : 5)
      .map((item) => ({ kind: 'hts' as const, item }))
    const inqs: Option[] = (inq.data?.items ?? []).slice(0, codeLike ? 2 : 4).map((q) => ({ kind: 'inq' as const, inq: q }))
    const g = [
      { key: 'hts', label: t('hts.search.groupHts'), items },
      { key: 'inq', label: t('hts.search.groupInquiries'), items: inqs },
    ]
    return (codeLike ? g : g.reverse()).filter((x) => x.items.length)
  }, [enabled, hts.data, inq.data, codeLike, t])
  const options = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => {
    if (active >= 0) document.getElementById(`${listId}-o${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, listId])

  // Prefill from ?q= (dashboard popular searches): auto-select an exact code match.
  const prefilled = useRef(false)
  useEffect(() => {
    if (!initialQuery || prefilled.current) return
    prefilled.current = true
    searchHtsItems(initialQuery)
      .then((items) => {
        const exact = items.find((i) => sameCode(i.htsCode, initialQuery))
        if (exact) select(exact)
        else {
          setText(initialQuery)
          setOpen(true)
        }
      })
      .catch(() => setText(initialQuery))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the initial URL value
  }, [initialQuery])

  function select(item: HtsItem) {
    setText(cleanCode(item.htsCode))
    setOpen(false)
    setActive(-1)
    onChange(item)
  }

  async function pickInquiry(q: HtsInquiry) {
    setResolving(q.id)
    try {
      const detail = await fetchHtsInquiry(q.id)
      const code = inquiryAnswerCode(detail)
      if (!code) {
        toast(t('hts.search.noAnswer'), 'info')
        return
      }
      const items = await searchHtsItems(code)
      const exact = items.find((i) => sameCode(i.htsCode, code))
      if (exact) select(exact)
      else {
        toast(t('hts.search.codeNotFound', { code }), 'info')
        setText(code)
        setActive(-1)
      }
    } catch (e) {
      toast(t('common.toast.apiError', { message: (e as Error).message }), 'error')
    } finally {
      setResolving(null)
    }
  }

  const choose = (o: Option) => (o.kind === 'hts' ? select(o.item) : void pickInquiry(o.inq))

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      if (!options.length) return
      const dir = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + dir + options.length) % options.length)
    } else if (e.key === 'Enter') {
      if (open && options.length) {
        e.preventDefault()
        choose(options[active >= 0 ? active : 0])
      }
    } else if (e.key === 'Escape') {
      if (open) setOpen(false)
      else if (text) clear()
    }
  }

  function clear() {
    setText('')
    setActive(-1)
    onChange(null)
    inputRef.current?.focus()
    setOpen(true)
  }

  const optId = (i: number) => `${listId}-o${i}`
  const loading = (hts.isLoading || hts.isValidating) && !hts.data
  const showList = open && !value && text.trim().length > 0

  return (
    <div className={s.wrap}>
      <div className={s.control} data-invalid={invalid || undefined} data-selected={value ? true : undefined}>
        <Search size={17} className={s.lead} aria-hidden />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optId(active) : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          spellCheck={false}
          placeholder={t('hts.calc.productPlaceholder')}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setActive(-1)
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={() => !value && setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {text && (
          <button type="button" className={s.clear} onClick={clear} aria-label={t('hts.search.clear')}>
            <X size={18} />
          </button>
        )}
      </div>
      {value && <span className="sr-only" aria-live="polite">{t('hts.search.selected', { code: cleanCode(value.htsCode) })}</span>}

      <div id={listId} role="listbox" aria-label={t('hts.search.label')} className={s.list} hidden={!showList} onMouseDown={(e) => e.preventDefault()}>
        {showList && text.trim().length < 2 && <p className={s.note}>{t('hts.search.minChars')}</p>}
        {showList && query.length >= 2 && loading && <p className={s.note}>{t('hts.search.searching')}</p>}
        {showList && hts.error && <p className={s.note}>{t('hts.search.error')}</p>}
        {showList && query.length >= 2 && !loading && !hts.error && !options.some((o) => o.kind === 'hts') && (
          <div className={s.note}>
            <strong>{t('hts.search.noResults', { query })}</strong>
            <span>{t('hts.search.noResultsHint')}</span>
          </div>
        )}
        {groups.map((g) => {
          const start = options.indexOf(g.items[0])
          return (
            <div key={g.key} role="group" aria-label={g.label}>
              <p className={s.groupLabel} aria-hidden>{g.label}</p>
              {g.items.map((o, j) => {
                const i = start + j
                const common = { id: optId(i), role: 'option' as const, 'aria-selected': active === i, onMouseEnter: () => setActive(i), onClick: () => choose(o) }
                if (o.kind === 'hts')
                  return (
                    <div key={`h${o.item.htsCode}`} {...common} className={s.option}>
                      <span className={`${s.code} tnum`}>{cleanCode(o.item.htsCode)}</span>
                      <span className={s.desc}>{lang === 'zh-CN' && o.item.descriptionZh ? o.item.descriptionZh : o.item.description}</span>
                    </div>
                  )
                const code = inquiryAnswerCode(o.inq)
                return (
                  <div key={`q${o.inq.id}`} {...common} aria-busy={resolving === o.inq.id || undefined} className={`${s.option} ${s.inqOption}`}>
                    <span className={s.inqName}>
                      <MessageSquareText size={15} aria-hidden />
                      <span>
                        {o.inq.productName}
                        {o.inq.productNameZh && <span className={s.zh}> · {o.inq.productNameZh}</span>}
                        {o.inq.material && <span className={s.zh}> · {o.inq.material}</span>}
                      </span>
                    </span>
                    <span className={s.inqMeta}>
                      {resolving === o.inq.id ? t('hts.search.lookingUp') : code ? <span className={`${s.code} tnum`}>→ {code}</span> : o.inq.answeredBy ? t('hts.search.answeredBy', { name: o.inq.answeredBy }) : t('hts.search.awaiting')}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
