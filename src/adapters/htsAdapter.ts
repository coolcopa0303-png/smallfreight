import type { RawHtsInquiry, RawHtsItem } from '@/domain/raw'
import type { AdditionalDuty, HtsInquiry, HtsItem } from '@/domain/types'

/** "6.80%" → 6.8 ; "Free" → 0 ; specific/compound rates ("2.4¢/kg + 5%") → undefined. */
export function parseAdValorem(duty: string): number | undefined {
  const s = duty.trim()
  if (/^free$/i.test(s)) return 0
  const m = s.match(/^(\d+(?:\.\d+)?)\s*%$/)
  return m ? Number(m[1]) : undefined
}

/**
 * The backend's `additionalDuty` is free text, one programme per line, e.g.
 * "7.5% - SECTION 301 …\n10% - SECTION 122\n25% - SECTION 301 … BATTERY …".
 * Lines are alternatives/conditional, so they are surfaced for the user to select — never auto-summed.
 */
export function parseAdditionalDuties(text: string): AdditionalDuty[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw, i) => {
      const m = raw.match(/^(\d+(?:\.\d+)?)\s*%\s*-?\s*(.*)$/)
      return { id: `ad-${i}`, ratePct: m ? Number(m[1]) : undefined, label: (m ? m[2] : raw).replace(/\s+/g, ' ').trim() || raw, raw }
    })
}

export function toHtsItem(r: RawHtsItem): HtsItem {
  return {
    htsCode: r.htsCode,
    description: r.description,
    descriptionZh: r.descriptionChinese || undefined,
    classification: r.classification || undefined,
    baseRatePct: parseAdValorem(r.duty),
    baseRateText: r.duty,
    additionalDuties: parseAdditionalDuties(r.additionalDuty ?? ''),
    pga: (r.pga ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    updatedAt: r.updatedAt,
  }
}

export function toHtsInquiry(r: RawHtsInquiry, myIds?: Set<number>): HtsInquiry {
  const answer = r.answer && typeof r.answer === 'object' ? r.answer : undefined
  return {
    id: r.id,
    productName: r.productName.trim(),
    productNameZh: r.productNameChinese || undefined,
    material: r.material || undefined,
    description: r.description || undefined,
    answeredBy: r.answerBy ?? undefined,
    createdAt: r.createdAt,
    answer: answer ? { htsCode: answer.htsCode as string | undefined, duty: answer.duty as string | undefined, description: answer.description as string | undefined } : undefined,
    aiAnswer: r.aiAnswer ?? undefined,
    mine: myIds?.has(r.id) ?? !!r.externalUserId,
  }
}
