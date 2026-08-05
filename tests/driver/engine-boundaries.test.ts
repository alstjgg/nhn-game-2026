// [e7#A14·A15] — the two boundaries this unit is not allowed to cross.
//
// A14: `tests/driver/` already held the client seam suites (u2). e7 ADDS files
// under that directory and rewrites none of them, so the five pre-existing
// files are pinned by content hash — the same technique the isomorphism guard
// uses on `tsconfig.core.json`, and for the same reason: a byte pin is the only
// check that cannot be satisfied by a plausible-looking edit.
//
// A15: `src/driver/` is compiled by `tsconfig.core.json`, which omits the DOM
// lib and empties `types`, so a host global does not RESOLVE there. This suite
// is the second half of that guard: it proves the folder does not reach for one
// by an injected-looking name, and that it imports nothing above itself.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DRIVER = path.join(REPO, 'src/driver')
const TESTS = path.join(REPO, 'tests/driver')

/** SHA-256 of every `tests/driver` file that existed before e7 (u2's suites). */
const FROZEN_SUITES: Readonly<Record<string, string>> = {
  'clock-hooks.test.ts': '94f58f28d1d34081ce1720f2b95d8a2c2b720408133693fea6cabdf1bba9af50',
  // RE-PINNED (2026-08-05, the live-desk wiring). A14's claim is "e7 does not
  // rewrite them", and it still holds — this move was made after both runs
  // merged, by hand, for a reason the suite itself now states: (e) used to
  // assert that even `driver/` imports no engine "YET", and the wiring is what
  // that word was waiting for. The guard was narrowed to `driver/live/` rather
  // than dropped, so the fixture driver is still held engine-free.
  'import-direction.test.ts': 'ab49d08566058a5670ffc3905a266605105ae3d29d8c41dd3451daf99464dc81',
  // RE-PINNED (C17): the client run (PR #110) rewrote this suite after u2 landed
  // it. A14's claim is "e7 does not rewrite them", so the pin moves to what main
  // carries; only a change made HERE can fail it.
  'replay-order.test.ts': 'b5ab5cbbb8dfaf69bc11c009e92aadc09af1ab28c7940d4ff9d6d621dc4d4934',
  'seam-leak-guard.test.ts': 'a9d72c720ceadf16ee01c87609628dcde808247265b1e1097093c0b47c0f4bf0',
  'seam-shapes.test.ts': '72f3f3866c8c552b16fa47fd1d843d2031eeabb3596f8e71c74de96f4c18e993',
}

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.isFile() && full.endsWith('.ts') ? [full] : []
  })
}

const rel = (file: string): string => path.relative(REPO, file).split(path.sep).join('/')

describe('[e7#A14] the existing tests/driver seam suites are untouched', () => {
  for (const [name, digest] of Object.entries(FROZEN_SUITES)) {
    it(`(a:${name}) is byte-identical to what u2 landed`, () => {
      const file = path.join(TESTS, name)
      expect(fs.existsSync(file), `${name} was deleted`).toBe(true)
      expect(sha256(file), `${name} was rewritten`).toBe(digest)
    })
  }

  // RE-AIMED (C17): the complement of FROZEN_SUITES used to be exactly "what e7
  // added". The client run (PR #110) then landed its own seam suites here, so the
  // negation now sweeps up files this unit never wrote. Named explicitly rather
  // than widened to a pattern: the claim is about e7's OWN additions, and a
  // pattern would stop noticing a stray non-`engine-*` file from this unit.
  //
  // Every entry is a deliberate registration, which is the point — a new suite
  // under this directory has to be claimed by somebody before the gate goes
  // green again.
  const CLIENT_RUN_SUITES = new Set([
    // PR #110, the client run's own seam suites.
    'clock-hook-determinism.test.ts',
    'run-loop-continuity.test.ts',
    // The live-desk wiring: `src/client/driver/live/`'s run transition. Client
    // side, not e7's, and deliberately not named `engine-*` for that reason.
    'live-adapter-run-transition.test.ts',
    // The live desk played to its end — the run's final beat, the animation
    // pump, the reload, and the deck. It DRIVES the engine (against the real
    // pack, offline) rather than asserting anything about it, which is why it
    // is registered here rather than named `engine-*`.
    'live-desk.test.ts',
    // The scorer: `score.json`'s units read against the state a run ended in.
    // It reads the engine's snapshot rather than asserting anything about the
    // engine, and it is `src/driver/`'s composition-facing half, not e7's.
    'scorer.test.ts',
  ])

  it('(b) everything e7 added under tests/driver is named `engine-*`', () => {
    const added = fs
      .readdirSync(TESTS, { withFileTypes: true })
      .map((entry) => entry.name)
      .filter((name) => !(name in FROZEN_SUITES) && !CLIENT_RUN_SUITES.has(name))
    expect(added.length).toBeGreaterThan(0)
    for (const name of added) expect(name.startsWith('engine-')).toBe(true)
  })

  it('(c) the fixtures are not suites — vitest’s include cannot pick them up', () => {
    const fixtures = walk(path.join(TESTS, 'engine-fixtures'))
    expect(fixtures.length).toBeGreaterThan(0)
    for (const file of fixtures) expect(file.endsWith('.test.ts')).toBe(false)
  })
})

describe('[e7#A15] src/driver/** is isomorphic', () => {
  // The same list `tests/scaffold/skeleton.test.ts` holds for the six core
  // folders, restated here so this unit's gate fails on its own file first.
  const BANNED = [
    /\bdocument\b/,
    /\bwindow\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /\bglobalThis\b/,
    /\bprocess\b/,
    /\bconsole\./,
    /\bfetch\b/,
    /\bDate\.now\b/,
    /\bMath\.random\b/,
    /\bstructuredClone\b/,
    /from\s+['"]node:/,
  ]

  it('(a) it names no host global, no clock and no randomness', () => {
    const offenders: string[] = []
    for (const file of walk(DRIVER)) {
      const source = fs.readFileSync(file, 'utf8')
      for (const banned of BANNED) {
        if (banned.test(source)) offenders.push(`${rel(file)} → ${banned}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('(b) it imports nothing from `src/client/` — the guard is re-stated, not borrowed', () => {
    const offenders: string[] = []
    for (const file of walk(DRIVER)) {
      const source = fs.readFileSync(file, 'utf8')
      if (/from\s+['"][^'"]*client\//.test(source)) offenders.push(rel(file))
    }
    expect(offenders).toEqual([])
    // …and it does carry its own copy, which is what decision 7 records.
    expect(fs.existsSync(path.join(DRIVER, 'seam-guard.ts'))).toBe(true)
  })

  it('(c) it imports nothing from `src/runloop/` — the direction is runloop → driver', () => {
    const offenders: string[] = []
    for (const file of walk(DRIVER)) {
      const source = fs.readFileSync(file, 'utf8')
      if (/from\s+['"][^'"]*runloop/.test(source)) offenders.push(rel(file))
    }
    expect(offenders).toEqual([])
  })

  it('(d) every file stays under the 800-line split threshold', () => {
    for (const file of walk(DRIVER)) {
      const lines = fs.readFileSync(file, 'utf8').split('\n').length
      expect(lines, `${rel(file)} is ${lines} lines`).toBeLessThan(800)
    }
  })

  it('(e) e0’s `createDriver` stub survives beside the live binding (OCP)', () => {
    const barrel = fs.readFileSync(path.join(DRIVER, 'index.ts'), 'utf8')
    // `tests/scaffold/skeleton.test.ts` runs the throw; what is checked here is
    // that e7 ADDED a factory rather than replacing the frozen one.
    expect(barrel).toContain("throw new Error('unimplemented: createDriver')")
    expect(barrel).toContain('createLiveDriver')
  })
})
