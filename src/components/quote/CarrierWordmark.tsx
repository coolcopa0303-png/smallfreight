import { LogoMark } from '@/components/layout/Logo'
import type { CarrierCode } from '@/domain/types'
import s from './wordmark.module.css'

/** Text wordmarks in brand-ish colours — no third-party logo files are shipped. */
export function CarrierWordmark({ carrier, size = 'md', muted }: { carrier: CarrierCode; size?: 'md' | 'sm'; muted?: boolean }) {
  const cls = [s.mark, s[size], muted && s.muted].filter(Boolean).join(' ')
  switch (carrier) {
    case 'saia':
      return <span className={`${cls} ${s.saia}`} aria-hidden>SAIA</span>
    case 'arcb':
      return (
        <span className={`${cls} ${s.abf}`} aria-hidden>
          ABF<small>Freight</small>
        </span>
      )
    case 'xpo':
      return <span className={`${cls} ${s.xpo}`} aria-hidden>XPO</span>
    case 'estes':
      return (
        <span className={`${cls} ${s.estesWrap}`} aria-hidden>
          <span className={s.estes}>E</span>
        </span>
      )
    case 'uber':
      return (
        <span className={`${cls} ${s.uber}`} aria-hidden>
          Uber{' '}<br />Freight
        </span>
      )
    case 'senmart':
      return (
        <span className={`${cls} ${s.sf}`} aria-hidden>
          <LogoMark className={s.sfLogo} />
        </span>
      )
  }
}
