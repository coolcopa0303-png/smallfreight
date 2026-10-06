// Builds the static sample-data demo into ./out (cross-platform env handling).
// Keeps out/.vercel (link to the "smallfreight" Vercel project) so redeploys update the same fixed URL.
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const link = 'out/.vercel'
const saved = '.vercel-demo-link'
if (fs.existsSync(link)) fs.cpSync(link, saved, { recursive: true })
fs.rmSync('out', { recursive: true, force: true })
execSync('node scripts/copy-maplibre-worker.mjs', { stdio: 'inherit' })
execSync('npx next build', { stdio: 'inherit', env: { ...process.env, STATIC_EXPORT: '1', NEXT_PUBLIC_DATA_MODE: 'mock' } })
execSync('node scripts/flatten-export.mjs', { stdio: 'inherit' })
if (fs.existsSync(saved)) fs.cpSync(saved, link, { recursive: true })
