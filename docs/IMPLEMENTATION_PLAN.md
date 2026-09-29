# SMALL FREIGHT Customer Portal — 实施说明（开工前输出）

依据：`SMALL_FREIGHT_CLAUDE_HANDOFF/CLAUDE_CODE_UI_SPEC.md` + `reference/01–06`。旧站只作为数据/接口/业务来源。

## 1. 技术栈

| 项 | 旧站（smallfreight.senmartintl.com） | 新 Portal（本目录） |
|---|---|---|
| 框架 | Next.js（Turbopack 构建）+ React | Next.js 16.3 App Router + React 19 + TypeScript |
| UI 库 | MUI Joy | 无 UI 库；CSS Modules + 全局 Design Tokens（spec §3） |
| 数据请求 | SWR + `apiGet/apiPost` 包装，Cookie 会话 | `lib/api/client.ts`（fetch 包装，Cookie 会话），`mock` / `live` 双模式 |
| i18n | i18next，`localStorage.language`，en / zh-CN | 轻量自研 `I18nProvider`，同一 `localStorage.language` 键，`locales/en/*.json` + `locales/zh-CN/*.json`（按模块分文件） |
| 地图 | 无 | Leaflet + react-leaflet（lazy / `ssr:false`）；底图 CARTO Voyager（报价页）、Esri World Imagery（详情页）；路线 OSRM；邮编坐标 zippopotam.us |
| 图标 / 国旗 | MUI Icons | lucide-react / flag-icons（SVG，Windows/Mac 一致） |

**数据模式**：`NEXT_PUBLIC_DATA_MODE=mock`（默认，脱敏样例数据，无需登录）或 `live`（`next.config.ts` 把 `/api/*` 反向代理到旧站，同源 Cookie，真实登录）。后台接口一律不改。

## 2. 现有 API 清单（抓包 + 旧站 JS 反查）

| 方法 | 路径 | 用途 | 新 UI 使用处 |
|---|---|---|---|
| POST | `/api/auth/login` `{email,password}` | 登录 | /login |
| POST | `/api/auth/logout` | 退出 | 头像菜单 |
| GET | `/api/me` | 用户、`billTos[{smallBillingId,periodDays}]`、userConfig | 全局（计算 `billingIdsAndTimeStart`） |
| PUT | `/api/users/password` | 修改密码 | 头像菜单 → 弹窗 |
| POST | `/api/booking/cargoes` `{billingIdsAndTimeStart,search,start,end,status[],types[],page,rowsPerPage≤99,order,orderBy}` | 货物列表（259 票） | Dashboard / Tracking / My Shipments / Detail / Analytics |
| GET | `/api/booking/export?…&column=…&lng=` | 导出 Excel | My Shipments |
| GET/PUT | `/api/user-config` | 列显示配置 | My Shipments 列设置 |
| GET | `/api/cargo-files?cargoId&billingIdsAndTimeStart` | 货物文件 | Detail → Documents |
| POST | `/api/quotations-browser` | 创建报价（LTL / FTL=拖车），返回 `saia/arcb/xpo/estes/uber/senmart/ftlPrice` | LTL / Drayage Quote |
| GET | `/api/quotations-browser?type&keyword&limit` `/summary?type&begin&end` `/{id}` | 报价历史 | My Inquiries → Quotes |
| PUT | `/api/quotations-browser/{id}/visible` `/{id}/shipments` | 隐藏报价 / 改描述 | My Inquiries |
| GET | `/api/geocode?zip=` → `{city,state}` | 邮编转城市 | 报价表单、地址簿 |
| GET | `/api/ftl-addresses` | 26 个港口/铁路场站 + 附加费价目 | Drayage Port 下拉、Route Details |
| GET | `/api/ftl-addresses/destination?zip&originId` | 拖车目的地校验 | Drayage 表单 |
| GET/POST/PUT/DELETE | `/api/addresses` `/api/addresses/{id}` | 地址簿 CRUD | Address Book、报价"选择地址" |
| GET | `/api/hts-items?keyword=` | HTS 税则库（duty、additionalDuty、PGA） | HTS Autocomplete / Calculator |
| GET/POST | `/api/hts-inquiries?keyword&page&myOnly` `/{id}` | HTS 人工咨询（含 answer / aiAnswer） | HTS 页"历史咨询"建议、My Inquiries |

## 3. 旧页面 → 新页面字段映射

**Booking（旧） → Shipment Tracking / My Shipments / Detail（新）**

| 旧字段 | 新 UI | 说明 |
|---|---|---|
| `displayId` | Shipment（SM#） | mono，可复制 |
| `mbl` / `hbl` | B/L、HBL | 行内第二行 |
| `containers[]` | Container | Detail → Containers tab |
| `ref` | Ref | 行内第三行 |
| `eta` | Est. Delivery / Arrival ETA | "in N days" |
| `types[]` 10/20/30/35/50 | Service（ISF / Customs Entry / Trucking / Freight / Arrival Notice） | 行内 badge 下方小字；FCL/LCL 由 hbl 推断 |
| `statusItems[]` | Last Update（最新一条）、Tracking tab 时间线 | 原文显示，不翻译 |
| `isfStatus` / `pgaStatus` / `customReleased` / `freightReleased` | My Shipments 表格列、Detail 状态区 | 保留旧站全部状态 |
| `containerDates.{lfd,pickupDate,deliverDate,emptyReturnDate,emptyNotificationDate}` | Detail → Key Dates / Containers | LFD 规则：>2 天普通 / 0–2 天橙 / 已过红 |
| `deliverTo` / `appointment` / `isf` | Detail → Shipment Details | |
| `isUrgent` | Exception 标记 | |
| **无** origin / destination / ETD / shipper / consignee / 货物信息 | 设计稿需要 | Adapter 读取可选字段 `pol/pod/etd/shipper/consignee/cargo`；live 缺失时显示"—"，mock 模式由样例数据提供。**需后台补充这些字段**。 |

**统一状态映射**（`src/domain/statusMap.ts`，唯一出处）：Booked → In Transit → At Port → Customs → Out for Delivery → Delivered；另有 Pending（仅立案）/ Exception（加急、ISF 未匹配）。

**LTL（旧 /new-quote） → /quotes/ltl**：Shipping Date→Pickup Date；Origin/Destination Zip+City+State→"City, State or ZIP"单框（邮编自动反查）；Weight/Units、L×W×H/Units、Handling、Count→Weight / Pieces / Dimensions（设计稿第二行）；Accessorials（26 项）→"More options"折叠区；Freight Class 旧 API 无此字段 → 显示"Auto（按密度估算）"，不提交。结果 `saia/arcb/xpo/estes/uber/senmart` → 6 张 Rate Card，null → "Rate not available / Request Rate"。

**Drayage（旧 /new-fcl-quote） → /quotes/drayage**：表单与旧页一致——Origin（Port + Terminal，来自 ftl-addresses）、Destination（Zip / City / State / Country）、Accessorial Services（Residential Delivery；More 里的 Overweight 按箱重自动勾选）、Shipment Information（可添加多个箱：Class 20/40/45，最大重量 36000/43000/43000 LBS，Weight、Units、Description）、Job Type、Others。结果只显示 SMALL FREIGHT 自营价：`ftlRate.baseRate`（含燃油）+ 车架费 × 2 天 = 预估总价，下方列出码头附加费（Pier pass 以美分存储，显示时 ÷100），右侧路线图与免责声明；不显示其它承运商。

**HTS（旧 /hts-inquiries） → /hts**：hts-items → Autocomplete + Duty 基础税率；`additionalDuty` 文本 → 可勾选的"附加关税"行（不自动叠加）；hts-inquiries（258 条人工答复）→ Autocomplete 的"历史咨询"分组 + My Inquiries；"+ 新咨询" → "Ask our team"。

**Address Book / LTL & Drayage 报价历史** → 保留，视觉统一；报价历史放入 My Inquiries。

## 4. 组件清单

```
components/layout   AppShell, Sidebar, GlobalHeader, NotificationsMenu, AccountMenu, MobileTabBar, PageHero
components/ui       Button, Input, Select, Field, Card, Badge, StatusChip, Tabs, Skeleton, Toast, Drawer, Modal,
                    CopyButton, EmptyState, ErrorState, Flag, Donut, Dropdown
components/shipment ShipmentListRow, ShipmentProgress, ShipmentRoute, FlagLocation, ShipmentStatusCard,
                    ShipmentTimeline, ShipmentMap, RecentShipmentsTable, ShipmentOverview
components/quote    QuoteForm(Ltl/Drayage), LocationInput, RateCard, RateDetailsDrawer, RouteMap, RouteDetails
components/hts      HtsSearchInput, DutySummary, CostBreakdown, DetailedBreakdown, ExclusionCodeRow
adapters/           shipmentAdapter, quoteAdapter, htsAdapter
services/           shipments, quotes, hts, dutyCalculator, geo, addresses, auth, announcements
domain/             statusMap, types
```

## 5. 开发顺序

1. Tokens / AppShell / Sidebar / Header / i18n / API client + mock / adapters
2. Dashboard → 3. Shipment Tracking → 4. Shipment Detail → 5. LTL → 6. Drayage → 7. HTS
8. Address Book / My Inquiries / My Shipments / Analytics / Help 视觉统一
9. Mobile → 10. Loading / Empty / Error / i18n 打磨；每页完成后与 reference 做桌面截图比对

## 6. 需要业务方确认的数据缺口

1. 货物接口没有起运港/目的港/ETD/发货人/收货人/货物明细 —— 设计稿的 Route、国旗、地图、Cargo Information 依赖它们。
2. 拖车报价后台只返回 SMALL FREIGHT 自营价（`ftlPrice`），设计稿中 5 家承运商比价需后台支持。
3. 关税计算：旧后台只有基础税率 + 附加关税文本；HMF/MPF 按公开费率在 `services/dutyCalculator.ts` 中估算（可配置），Section 301 等由用户勾选，不自动判定。
4. 公告（Announcements）暂无 API，读 `services/announcements.ts` 静态配置。
