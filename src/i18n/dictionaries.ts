// Each module owns one namespace file per language: src/locales/{lang}/{namespace}.json
// Keys are addressed as `${namespace}.${path}` — e.g. t('dashboard.hero.title').
import enAccount from '@/locales/en/account.json'
import enAddressBook from '@/locales/en/addressBook.json'
import enAnalytics from '@/locales/en/analytics.json'
import enCommon from '@/locales/en/common.json'
import enDashboard from '@/locales/en/dashboard.json'
import enDetail from '@/locales/en/detail.json'
import enHelp from '@/locales/en/help.json'
import enHts from '@/locales/en/hts.json'
import enInquiries from '@/locales/en/inquiries.json'
import enNav from '@/locales/en/nav.json'
import enQuotes from '@/locales/en/quotes.json'
import enShipments from '@/locales/en/shipments.json'
import enStatus from '@/locales/en/status.json'
import zhAccount from '@/locales/zh-CN/account.json'
import zhAddressBook from '@/locales/zh-CN/addressBook.json'
import zhAnalytics from '@/locales/zh-CN/analytics.json'
import zhCommon from '@/locales/zh-CN/common.json'
import zhDashboard from '@/locales/zh-CN/dashboard.json'
import zhDetail from '@/locales/zh-CN/detail.json'
import zhHelp from '@/locales/zh-CN/help.json'
import zhHts from '@/locales/zh-CN/hts.json'
import zhInquiries from '@/locales/zh-CN/inquiries.json'
import zhNav from '@/locales/zh-CN/nav.json'
import zhQuotes from '@/locales/zh-CN/quotes.json'
import zhShipments from '@/locales/zh-CN/shipments.json'
import zhStatus from '@/locales/zh-CN/status.json'

export type Lang = 'en' | 'zh-CN'

export const dictionaries: Record<Lang, Record<string, unknown>> = {
  en: {
    common: enCommon, nav: enNav, status: enStatus, account: enAccount, dashboard: enDashboard, shipments: enShipments,
    detail: enDetail, quotes: enQuotes, hts: enHts, addressBook: enAddressBook, inquiries: enInquiries, analytics: enAnalytics, help: enHelp,
  },
  'zh-CN': {
    common: zhCommon, nav: zhNav, status: zhStatus, account: zhAccount, dashboard: zhDashboard, shipments: zhShipments,
    detail: zhDetail, quotes: zhQuotes, hts: zhHts, addressBook: zhAddressBook, inquiries: zhInquiries, analytics: zhAnalytics, help: zhHelp,
  },
}
