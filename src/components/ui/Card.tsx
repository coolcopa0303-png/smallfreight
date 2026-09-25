import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import s from './ui.module.css'

export function Card({ className, padded = true, interactive, ...rest }: ComponentProps<'section'> & { padded?: boolean; interactive?: boolean }) {
  return <section className={[s.card, padded && s.cardPad, interactive && s.cardInteractive, className].filter(Boolean).join(' ')} {...rest} />
}

export function CardHeader({ icon, title, subtitle, action, className, as: Tag = 'h2' }: {
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
  as?: 'h2' | 'h3'
}) {
  return (
    <div className={[s.cardHeader, className].filter(Boolean).join(' ')}>
      {icon && <span className={s.cardIcon} aria-hidden>{icon}</span>}
      <div style={{ minWidth: 0 }}>
        <Tag className={s.cardTitle}>{title}</Tag>
        {subtitle && <p className={s.cardSub}>{subtitle}</p>}
      </div>
      {action && <div className={s.cardAction}>{action}</div>}
    </div>
  )
}

export function ViewAllLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={s.viewAll}>
      {children}
      <ArrowRight size={14} aria-hidden />
    </Link>
  )
}
