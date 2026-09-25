import type { Lang } from '@/i18n/dictionaries'
import type { HtsInquiry } from '@/domain/types'

/** Raw codes sometimes carry trailing whitespace/newlines from the backend. */
export const cleanCode = (code: string) => code.trim()
export const codeDigits = (code: string) => code.replace(/\D/g, '')
export const sameCode = (a: string, b: string) => codeDigits(a) === codeDigits(b) && codeDigits(a).length > 0

/** 17.6 → "17.6%", 25 → "25.0%", 0.3464 → "0.3464%". */
export function fmtRate(n?: number) {
  if (n === undefined || Number.isNaN(n)) return '—'
  const trimmed = n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  return `${trimmed.includes('.') ? trimmed : n.toFixed(1)}%`
}

/** Backend additional-duty labels mix English + Chinese ("SECTION 301 对中调查案301"). Show the part matching the UI language. */
export function localizeDutyLabel(label: string, lang: Lang, chinaWord: string) {
  if (lang === 'zh-CN') return label
  const china = /对中/.test(label)
  const en = label
    .replace(/[　-〿㐀-鿿＀-￯]+/g, ' ')
    .split(/\s+/)
    .filter((w, i, all) => w && w !== all[i - 1]) // "SECTION 301 调查案301" → "SECTION 301"
    .join(' ')
  if (!en) return label
  return china ? `${en} (${chinaWord})` : en
}

/** Staff answer first, then AI suggestion — ignoring placeholders like "NOT INITIALIZED". */
export function inquiryAnswerCode(q: Pick<HtsInquiry, 'answer' | 'aiAnswer'>): string | undefined {
  const valid = (c?: string) => (c && /\d{4}/.test(c) ? cleanCode(c) : undefined)
  return valid(q.answer?.htsCode) ?? valid(q.aiAnswer?.htsCode)
}

export function todayIso() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function fmtUpdated(iso: string | undefined, lang: Lang) {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

export function downloadCsv(filename: string, rows: (string | number | undefined)[][]) {
  const esc = (v: string | number | undefined) => {
    const s = v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM so Excel opens UTF-8 (Chinese descriptions) correctly.
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
