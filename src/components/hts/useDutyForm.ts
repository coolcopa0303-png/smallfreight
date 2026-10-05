'use client'

import { useMemo, useState } from 'react'
import type { HtsItem } from '@/domain/types'
import { calculateDuties, type ExclusionCode, type TransportMode } from '@/services/dutyCalculator'
import { todayIso } from './htsUtils'

export interface DutyForm {
  item: HtsItem | null
  value: string
  origin: string
  mode: TransportMode
  entryDate: string
  ladingDate: string
  selectedAdditional: string[]
  exclusions: ExclusionCode[]
}

const initial = (): DutyForm => ({
  item: null,
  value: '',
  origin: 'CN',
  mode: 'ocean',
  entryDate: todayIso(),
  ladingDate: todayIso(),
  selectedAdditional: [],
  exclusions: [],
})

export type DutyFormApi = ReturnType<typeof useDutyForm>

/** Calculator state. Results appear after the first "Calculate Duties" and then follow input changes live. */
export function useDutyForm() {
  const [form, setForm] = useState<DutyForm>(initial)
  const [calculated, setCalculated] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  // Bumped on reset so the autocomplete remounts with an empty query.
  const [resetKey, setResetKey] = useState(0)

  // Value is optional: left empty, the calculator still shows the duty rate; amounts render as "—".
  const valueNum = form.value.trim() === '' ? 0 : Number(form.value)
  const hasValue = valueNum > 0
  const errors: { item?: string; value?: string } = {
    item: !form.item ? 'hts.validation.item' : undefined,
    value: !(valueNum >= 0) ? 'hts.validation.value' : undefined,
  }
  const valid = !errors.item && !errors.value

  const result = useMemo(() => {
    if (!calculated || !form.item || !(valueNum >= 0)) return null
    return calculateDuties({
      item: form.item,
      value: valueNum,
      mode: form.mode,
      selectedAdditional: form.item.additionalDuties.filter((a) => form.selectedAdditional.includes(a.id)),
      exclusions: form.exclusions,
    })
  }, [calculated, form.item, valueNum, form.mode, form.selectedAdditional, form.exclusions])

  const set = <K extends keyof DutyForm>(k: K, v: DutyForm[K]) => setForm((f) => ({ ...f, [k]: v }))

  return {
    form,
    set,
    errors: showErrors ? errors : ({} as typeof errors),
    valid,
    valueNum,
    hasValue,
    result,
    calculated,
    resetKey,
    setItem: (item: HtsItem | null) => setForm((f) => ({ ...f, item, selectedAdditional: [] })),
    toggleAdditional: (id: string) =>
      setForm((f) => ({ ...f, selectedAdditional: f.selectedAdditional.includes(id) ? f.selectedAdditional.filter((x) => x !== id) : [...f.selectedAdditional, id] })),
    addExclusion: (code: string, note?: string) =>
      setForm((f) => ({ ...f, exclusions: [...f.exclusions, { id: `ex-${Date.now()}`, code, note: note || undefined, applied: false }] })),
    toggleExclusion: (id: string) => setForm((f) => ({ ...f, exclusions: f.exclusions.map((e) => (e.id === id ? { ...e, applied: !e.applied } : e)) })),
    removeExclusion: (id: string) => setForm((f) => ({ ...f, exclusions: f.exclusions.filter((e) => e.id !== id) })),
    calculate: () => {
      setShowErrors(true)
      if (valid) setCalculated(true)
      return valid
    },
    touch: () => setShowErrors(true),
    reset: () => {
      setForm(initial())
      setCalculated(false)
      setShowErrors(false)
      setResetKey((k) => k + 1)
    },
  }
}
