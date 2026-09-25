// No announcements API exists yet (spec §5.4). Static config until a CMS endpoint is available.
export interface Announcement {
  id: string
  kind: 'alert' | 'info' | 'notice'
  date: string
  title: { en: string; 'zh-CN': string }
  body: { en: string; 'zh-CN': string }
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    kind: 'alert',
    date: '2026-09-22',
    title: { en: 'Port Congestion – Los Angeles/Long Beach', 'zh-CN': '洛杉矶 / 长滩港口拥堵' },
    body: { en: 'Increased dwell times expected through Oct 31, 2026.', 'zh-CN': '预计 2026 年 10 月 31 日前码头滞留时间延长。' },
  },
  {
    id: 'a2',
    kind: 'info',
    date: '2026-09-18',
    title: { en: 'New Surcharge – West Coast Terminals', 'zh-CN': '美西码头新增附加费' },
    body: { en: 'A terminal handling surcharge will take effect Nov 1, 2026.', 'zh-CN': '码头操作附加费将于 2026 年 11 月 1 日起生效。' },
  },
  {
    id: 'a3',
    kind: 'notice',
    date: '2026-09-15',
    title: { en: 'Holiday Schedule Update', 'zh-CN': '节假日服务时间调整' },
    body: { en: 'Our customer service hours will be affected on Nov 23, 2026.', 'zh-CN': '2026 年 11 月 23 日客服时间将有调整。' },
  },
]

/** Contact details shown on Help & Support / Request Rate (from the old portal's footer). */
export const SUPPORT = {
  phone: '(516) 962-0966',
}
