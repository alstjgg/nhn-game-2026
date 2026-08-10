// Stamps a verified licence onto every `assets-manifest.json` row that shares a
// generating tool.
//
//   node tools/assets/stamp-license.mjs --tool gpt-image-1 \
//     --license "<what the clause grants, in one sentence>" \
//     --source  "https://openai.com/policies/… §<n> (checked YYYY-MM-DD)"
//
// Why a script rather than an edit: 29 rows share one legal basis, and a
// competition judge asking "what licence is this image under" has to get the
// same answer from every one of them. Hand-editing 29 rows is how they drift.
//
// It refuses to write a `license_source` that carries no URL and no check date,
// because that is the exact failure this exists to fix: `"generated for this
// project"` was our own words, not a right anybody granted us. A licence claim
// in a submitted document needs a citation or it is not a claim.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const MANIFEST = path.join(REPO, 'assets-manifest.json')

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}

const tool = flag('tool')
const license = flag('license')
const source = flag('source')

if (tool === null || license === null || source === null) {
  console.error('usage: --tool <substring> --license <text> --source <url + clause + check date>')
  process.exit(2)
}
if (!/https?:\/\//.test(source)) {
  console.error('refusing: --source must contain the URL the claim was read from')
  process.exit(2)
}
if (!/\d{4}-\d{2}-\d{2}/.test(source)) {
  console.error('refusing: --source must carry the date it was checked (YYYY-MM-DD)')
  process.exit(2)
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
let stamped = 0
for (const asset of manifest.assets) {
  if (!String(asset.tool ?? '').includes(tool)) continue
  asset.license = license
  asset.license_source = source
  stamped += 1
}

if (stamped === 0) {
  console.error(`no asset has a tool containing "${tool}" — nothing written`)
  process.exit(1)
}

fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`assets-manifest.json — ${stamped} rows stamped for "${tool}"`)
