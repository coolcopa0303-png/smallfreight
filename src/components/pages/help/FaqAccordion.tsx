'use client'

import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import s from './help.module.css'

export interface FaqItem {
  id: string
  question: string
  content: ReactNode
}

/** Disclosure-pattern accordion: each header is a button (aria-expanded/aria-controls) owning a labelled region. */
export function FaqAccordion({ items, defaultOpen = [] }: { items: FaqItem[]; defaultOpen?: string[] }) {
  const base = useId()
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen))
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={s.faq}>
      {items.map((item) => {
        const expanded = open.has(item.id)
        const btnId = `${base}-${item.id}-btn`
        const panelId = `${base}-${item.id}-panel`
        return (
          <div key={item.id} className={s.faqItem} data-open={expanded || undefined}>
            <h3 className={s.faqHeading}>
              <button type="button" id={btnId} className={s.faqButton} aria-expanded={expanded} aria-controls={panelId} onClick={() => toggle(item.id)}>
                <span>{item.question}</span>
                <ChevronDown size={18} className={s.faqChevron} aria-hidden />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} className={s.faqPanel} hidden={!expanded}>
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
