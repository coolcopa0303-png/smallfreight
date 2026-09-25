# SMALL FREIGHT Customer Portal (new UI)

Customer-facing rebuild of smallfreight.senmartintl.com per `../SMALL_FREIGHT_CLAUDE_HANDOFF/CLAUDE_CODE_UI_SPEC.md`
and the reference designs in `../SMALL_FREIGHT_CLAUDE_HANDOFF/reference/`. Implementation notes, API inventory and
field mapping: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md).

## Run

```bash
npm install
npm run dev            # http://localhost:3000 — sample-data mode (no login / backend needed)
```

### Data modes

| Mode | How | What happens |
|---|---|---|
| `mock` (default) | nothing to set | In-browser mock of the backend (`src/mocks/`) with anonymized fixtures built from captured API responses. A "Sample data" badge shows in the header. |
| `live` | `NEXT_PUBLIC_DATA_MODE=live npm run dev` | `/api/*` is proxied to the existing backend (`SMALL_FREIGHT_API_ORIGIN`, default `https://smallfreight.senmartintl.com`) so the session cookie is same-origin. Log in with a real portal account at `/login`. |

### Static demo (sample data, any static host)

```bash
npm run build:demo     # STATIC_EXPORT=1 next build + scripts/flatten-export.mjs → ./out
cd out && npx vercel deploy --yes     # or upload ./out to any static host
```

The backend contract is unchanged — the new UI only reads/writes the existing `/api/...` endpoints.

## Structure

```
src/app/(portal)/*        pages (Dashboard, Shipments, Shipment Detail, Quotes, HTS, Address Book, My Inquiries, Analytics, Help)
src/app/login             login
src/components/ui         design-system primitives (Button, Field, Card, StatusChip, Tabs, Drawer, Toast…)
src/components/layout     AppShell, Sidebar, GlobalHeader, PageHero
src/components/<area>     page-level components
src/domain                raw API types, view models, statusMap.ts (single source of status logic)
src/adapters              raw API → view model mappers
src/services              API calls + business services (dutyCalculator, geo)
src/locales/{en,zh-CN}    i18n namespaces (one JSON per module)
src/mocks                 mock backend + fixtures (regenerate: node scripts/build-fixtures.mjs)
```

## Known data gaps (need backend fields)

- Shipments have no origin/destination/ETD/shipper/consignee/cargo details — the UI supports them via optional
  fields (`pol`, `pod`, `etd`, `shipper`, `consignee`, `cargo`) and shows "—" when absent.
- Drayage quotes: the backend returns SMALL FREIGHT's own price (`ftlPrice`); other carriers render only if returned.
- Duty calculator: base rates from `/api/hts-items`; HMF/MPF formulas live in `src/services/dutyCalculator.ts`
  (`FEE_RULES`) and must be confirmed by the customs team; additional duties are user-selected, never auto-applied.
- Announcements are static (`src/services/announcements.ts`) until a CMS/API exists.

## Third-party services used by maps

CARTO / OpenStreetMap tiles, Esri World Imagery, OSRM demo routing, zippopotam.us ZIP coordinates — fine for a
prototype; switch to a licensed provider in `src/services/geo.ts` / `src/components/map/MapCanvas.tsx` for production.
