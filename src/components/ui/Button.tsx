import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import s from './ui.module.css'

type Variant = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

interface Common {
  variant?: Variant
  size?: Size
  block?: boolean
  iconOnly?: boolean
  loading?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

function cls({ variant = 'primary', size = 'md', block, iconOnly }: Common, extra?: string) {
  return [s.btn, s[variant], size !== 'md' && s[size], block && s.block, iconOnly && s.iconOnly, extra].filter(Boolean).join(' ')
}

export function Button({ variant, size, block, iconOnly, loading, leading, trailing, className, children, disabled, ...rest }: Common & ComponentProps<'button'>) {
  return (
    <button type="button" className={cls({ variant, size, block, iconOnly }, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className={s.spinner} aria-hidden /> : leading}
      {children}
      {trailing}
    </button>
  )
}

export function ButtonLink({ variant, size, block, iconOnly, leading, trailing, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cls({ variant, size, block, iconOnly }, className)} {...rest}>
      {leading}
      {children}
      {trailing}
    </Link>
  )
}
