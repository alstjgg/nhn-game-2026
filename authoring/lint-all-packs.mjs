#!/usr/bin/env node
// Lints EVERY pack under `data/scenario/`, and exists because the alternative
// rots. `check` used to name one slug, so the day a second pack landed it had
// no gate at all: its predicates could name a flag nothing sets and the suite
// would stay green. Naming the second slug too would only move that hole to
// the third pack — enumeration is what closes it for good.
//
// The `_`-prefix skip is the same rule `vite.config.ts` `packSlugs()` applies,
// and for the same reason: `_schema/` is the contract, not a pack.
//
// `readdirSync` rather than a shell glob is deliberate. Pack directories carry
// Korean names, and macOS hands them back NFD where git and the shell disagree
// about normalization — `tests/fixtures/fixture-utils.ts` normalizes for that
// reason. Reading the directory and passing the entry straight through never
// makes a round trip that could re-normalize the name.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const SCENARIO_DIR = join(process.cwd(), 'data', 'scenario')
const LINTER = join('authoring', 'lint-datapack.mjs')

const slugs = readdirSync(SCENARIO_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort()

// An empty `data/scenario/` means the enumeration silently linted nothing,
// which is the failure this script was written to prevent — so it is an error.
if (!slugs.length) {
  console.error(`✗ no packs under ${SCENARIO_DIR} — nothing was linted`)
  process.exit(1)
}

const failed = []
for (const slug of slugs) {
  console.log(`\n── ${slug} ${'─'.repeat(Math.max(0, 60 - slug.length))}`)
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', LINTER, join('data', 'scenario', slug)],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) failed.push(slug)
}

console.log(`\n${'═'.repeat(64)}`)
if (failed.length) {
  console.error(`✗ ${failed.length} of ${slugs.length} pack(s) not consumable: ${failed.join(', ')}`)
  process.exit(1)
}
console.log(`✓ ${slugs.length} pack(s) consumable: ${slugs.join(' · ')}`)
