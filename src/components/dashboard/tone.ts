import type { StatusTone } from '@/domain/statusMap'

/** Solid colour token per status tone — same palette as StatusChip (spec §4.5), used for accents and the donut. */
export const TONE_COLOR: Record<StatusTone, string> = {
  blue: 'var(--brand-primary)',
  orange: 'var(--warning)',
  purple: 'var(--purple)',
  green: 'var(--success)',
  gray: 'var(--neutral)',
  red: 'var(--danger)',
}
