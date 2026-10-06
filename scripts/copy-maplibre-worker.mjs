// maplibre-gl loads its worker via `new URL('./maplibre-gl-worker.mjs', import.meta.url)`, which Turbopack
// rewrites to a chunk path that doesn't exist — the worker 404s and only the raster layers of a vector style
// render. Serving the worker ourselves from /public and pointing setWorkerUrl() at it avoids the bundler
// entirely; the worker's one relative import (maplibre-gl-shared.mjs) resolves next to it.
import fs from 'node:fs'
import path from 'node:path'

const from = path.join('node_modules', 'maplibre-gl', 'dist')
const to = path.join('public', 'maplibre')
const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

fs.mkdirSync(to, { recursive: true })
for (const f of files) fs.copyFileSync(path.join(from, f), path.join(to, f))
console.log(`copied maplibre worker (${files.join(', ')}) to ${to}`)
