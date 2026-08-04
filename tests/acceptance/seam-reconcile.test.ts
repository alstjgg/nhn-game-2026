// [u11#c14] C19 — every one of u2f's thirteen base measurements is classified:
// STALE unit-scoped assert (re-aimed per C12/C17) or REAL seam break (fixed at
// the owning unit + logged in DISCOVERY).
//
// On the "7/13" in C19: BUILD went back to the raw record (`discovery/u2f.md`
// §5) and it reads "**7 files / 13 tests** already red before this unit" — seven
// FILES, thirteen TESTS, all thirteen red. `seam-ledger.ts` reconstructs them
// test by test and lands on exactly those counts; `RED` is therefore 13 and the
// file count is kept as `RED_FILES`, so (b) below now demands MORE of the ledger
// than the compressed reading did, and (b2) pins the seven that were lost in it.
//
// The ledger itself lives in `seam-ledger.ts` (data); the rules live here
// (asserts). Nothing in this file may be relaxed to make a row fit — a row that
// cannot satisfy these is a row that was classified wrong.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MEASURED, RED, RED_FILES, SEAM_LEDGER } from './seam-ledger.ts'
import type { SeamRow } from './seam-ledger.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DISCOVERY = path.join(REPO, 'DISCOVERY.md')

const discovery = (): string => fs.readFileSync(DISCOVERY, 'utf8')

/** Comments name the banned forms in order to ban them — scan CODE only. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|\n)\s*\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, ' '))
}

const rows = (cls: SeamRow['class']): SeamRow[] => SEAM_LEDGER.filter((r) => r.class === cls)

describe('[u11#c14] the ledger accounts for every measurement', () => {
  it('(a) holds exactly the thirteen checks u2f measured', () => {
    expect(SEAM_LEDGER.length, `C19 requires all ${MEASURED} measurements classified`).toBe(MEASURED)
  })

  it('(b) exactly seven of them are the reds u2f recorded', () => {
    expect(SEAM_LEDGER.filter((r) => r.wasRed).length, `u2f recorded ${RED} reds on its base`).toBe(RED)
  })

  it('(b2) those reds span exactly the seven files u2f named', () => {
    const files = new Set(SEAM_LEDGER.filter((r) => r.wasRed).map((r) => r.measuredIn))
    expect(files.size, `u2f recorded its reds in ${RED_FILES} files`).toBe(RED_FILES)
    const missing = [...files].filter((f) => !fs.existsSync(path.join(REPO, f)))
    expect(missing, 'a measured file no longer exists — the reconstruction is wrong').toEqual([])
  })

  it('(c) every row is uniquely keyed and carries the command it was measured with', () => {
    const ids = SEAM_LEDGER.map((r) => r.id)
    expect(new Set(ids).size, 'two rows share an id').toBe(ids.length)
    for (const row of SEAM_LEDGER) {
      expect(row.id.trim().length, 'a row has an empty id').toBeGreaterThan(0)
      expect(row.verify, `${row.id} names no verification command`).toMatch(/npx (vitest|playwright)/)
    }
  })

  it('(d) every row is classified — nothing is left unlabelled', () => {
    const unclassified = SEAM_LEDGER.filter((r) => r.class !== 'STALE' && r.class !== 'REAL')
    expect(unclassified.map((r) => r.id)).toEqual([])
  })
})

describe('[u11#c14] a STALE row names a real re-aim (C12/C17)', () => {
  it('(e) each STALE target is a test file that exists on disk', () => {
    const missing = rows('STALE').filter((r) => !fs.existsSync(path.join(REPO, r.target)))
    expect(missing.map((r) => `${r.id} → ${r.target}`), 'a STALE row points at no file').toEqual([])
  })

  it('(f) each re-aimed file says WHY it was re-aimed, so the history survives', () => {
    const silent = rows('STALE').filter((r) => {
      const file = path.join(REPO, r.target)
      if (!fs.existsSync(file)) return true
      const source = fs.readFileSync(file, 'utf8')
      return !/(C17|C12|re-aim|reconcil)/i.test(source)
    })
    expect(silent.map((r) => r.target), 'a re-aimed file carries no note explaining the re-aim').toEqual([])
  })

  it('(g) no re-aim was performed by exclusion — nothing is skipped or excluded to go green', () => {
    const offenders: string[] = []
    for (const row of rows('STALE')) {
      const file = path.join(REPO, row.target)
      if (!fs.existsSync(file)) continue
      const source = fs.readFileSync(file, 'utf8')
      if (/\b(it|test|describe)\.(skip|fixme)\s*\(\s*['"`]|\b(it|test)\.todo\b|\bx(it|describe)\s*\(/.test(source)) {
        offenders.push(row.target)
      }
    }
    expect(offenders, 'a check was skipped instead of re-aimed (C17)').toEqual([])
  })
})

describe('[u11#c14] a REAL row routes to its owner, never to u11 ([u11#c8])', () => {
  it('(h) each REAL row names an owning unit', () => {
    const unowned = rows('REAL').filter((r) => !r.owner || !/^u\d/.test(r.owner))
    expect(unowned.map((r) => r.id), 'a REAL seam break names no owning unit').toEqual([])
  })

  it('(i) u11 never owns a REAL break — it reports and routes', () => {
    expect(rows('REAL').filter((r) => r.owner === 'u11').map((r) => r.id)).toEqual([])
  })

  it('(j) each REAL row has a DISCOVERY line naming it', () => {
    const body = discovery()
    const unlogged = rows('REAL').filter((r) => !body.includes(r.id))
    expect(unlogged.map((r) => r.id), 'a REAL seam break is not logged in DISCOVERY.md').toEqual([])
  })

  it('(k) each REAL row states the break, not just the command', () => {
    const thin = rows('REAL').filter((r) => r.target.trim().split(/\s+/).length < 4)
    expect(thin.map((r) => r.id), 'a REAL row records no statement of what broke').toEqual([])
  })
})

describe('[u11#c14] the whole suite stays a real suite', () => {
  it('(l) no vitest/playwright config excludes a test path to make the run green (C17)', () => {
    const vitestConfig = fs.readFileSync(path.join(REPO, 'vitest.config.ts'), 'utf8')
    const exclude = vitestConfig.match(/exclude:\s*\[([^\]]*)\]/)?.[1] ?? ''
    const allowed = ['node_modules/**', 'dist/**', 'demos/**', 'e2e/**']
    const listed = [...exclude.matchAll(/'([^']+)'/g)].map((m) => m[1]!)
    expect(listed.filter((p) => !allowed.includes(p)), 'a new vitest exclusion appeared').toEqual([])
    expect(vitestConfig).toContain("include: ['tests/**/*.test.ts']")
  })

  it('(m) no test anywhere is DISABLED — the conditional guard form is the only skip allowed', () => {
    // `test.skip(condition, reason)` inside a test body is a runtime guard on a
    // precondition, not a disabled test (u8's overflow guard is one). What C17
    // bans is the DECLARATION form — `it.skip('…')`, `describe.skip('…')`,
    // `xit(…)`, `it.todo(…)`, `test.fixme('…')` — which removes a check.
    const DISABLED = /\b(it|test|describe)\.(skip|fixme)\s*\(\s*['"`]|\bx(it|describe)\s*\(|\b(it|test)\.todo\b/
    const walk = (dir: string): string[] => {
      const out: string[] = []
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) out.push(...walk(full))
        else if (/\.(test|spec)\.ts$/.test(entry.name)) out.push(full)
      }
      return out
    }
    const offenders: string[] = []
    for (const file of [...walk(path.join(REPO, 'tests')), ...walk(path.join(REPO, 'e2e'))]) {
      const source = stripComments(fs.readFileSync(file, 'utf8'))
      for (const [i, line] of source.split('\n').entries()) {
        if (DISABLED.test(line)) offenders.push(`${path.relative(REPO, file)}:${i + 1}`)
      }
    }
    expect(offenders, 'a test was disabled to make the full suite green (C17)').toEqual([])
  })
})
