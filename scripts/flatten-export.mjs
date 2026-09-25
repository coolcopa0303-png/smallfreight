// Post-process for `STATIC_EXPORT=1 next build`.
// Next 16 writes route-segment prefetch payloads as nested folders
//   out/dashboard/__next.<group>/dashboard/__PAGE__.txt
// but the client requests the dot-joined name
//   out/dashboard/__next.<group>.dashboard.__PAGE__.txt
// Plain static hosts can't map one to the other, so copy each nested file to its flat name.
import fs from 'node:fs'
import path from 'node:path'

const out = path.resolve(import.meta.dirname, '../out')
let copied = 0

function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walkFiles(p) : [p]
  })
}

function visit(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const p = path.join(dir, e.name)
    if (e.name.startsWith('__next.')) {
      for (const file of walkFiles(p)) {
        const flat = [e.name, ...path.relative(p, file).split(path.sep)].join('.')
        fs.copyFileSync(file, path.join(dir, flat))
        copied++
      }
    } else {
      visit(p)
    }
  }
}

visit(out)
console.log(`flatten-export: ${copied} segment files copied`)
