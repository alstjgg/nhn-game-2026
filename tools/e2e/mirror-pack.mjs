// Mirrors the published datapack into a non-deploy build directory.
//
// C5 says the e2e server is `vite preview` against a REAL build, and
// spec-client §5.4 says the fixtures the suite drives only exist in a
// development-mode bundle — so the e2e build cannot be the deploy build, and
// `playwright.config.ts` sends it to its own `--outDir` instead of overwriting
// `dist/` (which `tests/fixtures/dev-only.test.ts` greps for fixture strings).
//
// The §3.7 pack-copy plugin in `vite.config.ts` publishes `data/{scenario,
// policy}` beside the DEPLOY bundle, by name — that plugin is 윤석's and this
// run owns no change to it (`tests/scaffold/isomorphism-guard.test.ts`
// [u0#c9]). So this step mirrors what the plugin just published rather than
// re-deciding what is publishable: `dist/data` is the single source of truth
// for "the pack the browser is allowed to see", and a directory that never
// reaches `dist/data` can never reach an e2e build either.
import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const target = process.argv[2]
if (!target) {
  console.error('usage: node tools/e2e/mirror-pack.mjs <build-dir>')
  process.exit(1)
}

const published = join(process.cwd(), 'dist', 'data')
if (!existsSync(published)) {
  console.error(`no published pack at ${published} — did the build run?`)
  process.exit(1)
}
if (!existsSync(join(process.cwd(), target))) {
  console.error(`no build at ${target} — did the build run?`)
  process.exit(1)
}

cpSync(published, join(process.cwd(), target, 'data'), { recursive: true })
