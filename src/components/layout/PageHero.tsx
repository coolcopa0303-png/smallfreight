import type { ReactNode } from 'react'
import s from './hero.module.css'

export const HERO_IMAGES = {
  port: '/images/hero-port.webp',
  truck: '/images/hero-truck.webp',
  ship: '/images/hero-ship.webp',
} as const

/** Photo banner with a left→right navy overlay so text stays readable (spec §5.2 / §7.1 / §10.2). */
export function PageHero({ image, title, subtitle, height, children, aside, position = 'center' }: {
  image: keyof typeof HERO_IMAGES
  title: ReactNode
  subtitle?: ReactNode
  height?: number
  children?: ReactNode
  aside?: ReactNode
  position?: string
}) {
  return (
    <section className={s.hero} style={{ minHeight: height }}>
      <div className={s.photo} style={{ backgroundImage: `url(${HERO_IMAGES[image]})`, backgroundPosition: position }} role="img" aria-label="" />
      <div className={s.shade} aria-hidden />
      <div className={s.inner}>
        <div className={s.copy}>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
          {children}
        </div>
        {aside && <div className={s.aside}>{aside}</div>}
      </div>
    </section>
  )
}
