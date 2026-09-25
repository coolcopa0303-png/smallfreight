import { BarChart3, Boxes, FileText, Home, LifeBuoy, MessageSquareText, Search, Truck, BookUser, type LucideIcon } from 'lucide-react'

export interface NavEntry {
  href: string
  labelKey: string
  icon: LucideIcon
  /** Extra path prefixes that should highlight this entry. */
  match?: string[]
  children?: { href: string; labelKey: string }[]
}

// Fixed order (spec §1).
export const NAV: NavEntry[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: Home },
  { href: '/shipments', labelKey: 'nav.shipmentTracking', icon: Truck, match: ['/shipments'] },
  {
    href: '/quotes/ltl',
    labelKey: 'nav.getQuote',
    icon: FileText,
    match: ['/quotes'],
    children: [
      { href: '/quotes/ltl', labelKey: 'nav.ltlQuote' },
      { href: '/quotes/drayage', labelKey: 'nav.drayageQuote' },
    ],
  },
  { href: '/hts', labelKey: 'nav.htsSearch', icon: Search },
  { href: '/address-book', labelKey: 'nav.addressBook', icon: BookUser },
  { href: '/my-shipments', labelKey: 'nav.myShipments', icon: Boxes },
  { href: '/my-inquiries', labelKey: 'nav.myInquiries', icon: MessageSquareText },
  { href: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { href: '/help', labelKey: 'nav.help', icon: LifeBuoy },
]

/** Shipment detail belongs to "My Shipments" (reference 05); list pages own their own prefix. */
export function isActive(entry: NavEntry, pathname: string) {
  if (entry.href === '/my-shipments' && /^\/shipments\/[^/]+/.test(pathname)) return true
  if (entry.href === '/shipments') return pathname === '/shipments'
  return pathname === entry.href || (entry.match ?? [entry.href]).some((p) => pathname.startsWith(p + '/') || pathname === p)
}
