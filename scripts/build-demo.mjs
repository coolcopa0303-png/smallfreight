// Builds the static sample-data demo into ./out (cross-platform env handling).
import { execSync } from 'node:child_process'
import fs from 'node:fs'

fs.rmSync('out', { recursive: true, force: true })
execSync('npx next build', { stdio: 'inherit', env: { ...process.env, STATIC_EXPORT: '1', NEXT_PUBLIC_DATA_MODE: 'mock' } })
execSync('node scripts/flatten-export.mjs', { stdio: 'inherit' })
