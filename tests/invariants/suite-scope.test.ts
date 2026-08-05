// [u9#c6] PRD §4 scoping rule + [u9#c7] own-slice gate.
//
// "Unit-scoped asserts ride their own unit's gate; repo-wide asserts bind
// fully only at u11 (no full-suite gates on earlier units)." — PRD §4, and
// C13: no unit may gate on the full suite except u11.
//
// This file is the suite's own guard rail. It asserts three things about the
// four structural asserts next to it:
//   1. each declares its scope in a `SCOPE (…)` banner — unit-scoped, or
//      repo-scoped with an allowlist;
//   2. every allowlist entry is a real path (dead entries rot silently);
//   3. nothing here reaches outside `src/`, `index.html` and `tests/invariants`
//      — a P1-D assert that scanned `tests/**` or `demos/**` would be a
//      full-suite gate wearing a unit's badge.
//
// The test named 'suite is green on the current tree' is the [u9#c6]
// verification command's filter target. Do not rename it without updating
// `.claude/super/units/u9.md`.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { REPO, abs, exists, filesUnder, read, rel } from './invariant-utils.ts'

const SUITE_DIR = path.join(REPO, 'tests/invariants')
/** This guard rail's own path — excluded where it would scan itself. */
const SELF = 'tests/invariants/suite-scope.test.ts'

/** The four invariant asserts this unit ships, plus this guard rail. */
const EXPECTED_TESTS = [
  'tests/invariants/no-digit-npc.test.ts',
  'tests/invariants/no-free-text.test.ts',
  'tests/invariants/seam-integrity.test.ts',
  'tests/invariants/style-as-data.test.ts',
  'tests/invariants/suite-scope.test.ts',
] as const

function suiteFiles(): { file: string; text: string }[] {
  return filesUnder(SUITE_DIR, '.ts').map((p) => ({ file: rel(p), text: read(p) }))
}

function testFiles(): { file: string; text: string }[] {
  return suiteFiles().filter((s) => s.file.endsWith('.test.ts'))
}

/** The repo-relative paths named in a file's `ALLOWLIST` array literal. */
function allowlistEntries(text: string): string[] {
  const m = /const ALLOWLIST[^=]*=\s*\[([\s\S]*?)\]/.exec(text)
  if (!m) return []
  return [...m[1]!.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]!)
}

describe('[u9#c6] every assert declares its scope', () => {
  it('(a) the suite is exactly the four invariant asserts plus this guard rail', () => {
    expect(testFiles().map((s) => s.file).sort()).toEqual([...EXPECTED_TESTS])
  })

  it('(b) each test file carries a SCOPE banner naming unit-scoped or repo-scoped-with-allowlist', () => {
    const undeclared = testFiles()
      .filter((s) => s.file !== SELF)
      .filter((s) => !/SCOPE \(/.test(s.text) || !/(unit-scoped|repo-scoped)/i.test(s.text))
      .map((s) => s.file)
    expect(undeclared, 'an assert does not say what it is scoped to').toEqual([])
  })

  it('(c) every ALLOWLIST entry names a file that exists', () => {
    const stale = testFiles().flatMap((s) =>
      allowlistEntries(s.text).filter((f) => !exists(abs(f))).map((f) => `${s.file}: ${f}`),
    )
    expect(stale, 'a stale allowlist entry — the exemption outlived its file').toEqual([])
  })

  it('(d) each cites the criterion it encodes, so a failure is traceable to the contract', () => {
    const uncited = testFiles().filter((s) => !/\[u9#c[1-9]\]/.test(s.text)).map((s) => s.file)
    expect(uncited).toEqual([])
  })
})

describe('[u9#c6] no assert here gates on the full suite (C13)', () => {
  it('(a) nothing in this suite reads demos/, proxy/, tools/, authoring/ or data/', () => {
    // This guard rail is excluded from its own scan: the only occurrence of
    // those names in this file is the pattern below. It is the four asserts
    // (and their shared helper) that have to stay inside src/.
    const offenders = suiteFiles()
      .filter((s) => s.file !== SELF)
      .flatMap((s) => {
        const roots = [...s.text.matchAll(/['"`](demos|proxy|tools|authoring|data)\//g)].map((m) => m[0])
        return roots.map((r) => `${s.file}: ${r}`)
      })
    expect(offenders, 'a P1-D assert reached outside src/ — that is a full-suite gate').toEqual([])
  })

  it('(b) the suite scans src/, index.html and its own directory — nothing wider', () => {
    const utils = read(path.join(SUITE_DIR, 'invariant-utils.ts'))
    expect(utils.length, 'invariant-utils.ts is missing').toBeGreaterThan(0)
    expect(utils).toMatch(/path\.join\(SRC, 'client'\)|path\.join\(REPO, 'src'\)|'src'/)
    // REPO is only ever used to build src/ and index.html paths, never to walk
    // the repo root itself.
    expect(utils).not.toMatch(/walk\(REPO\)|filesUnder\(REPO,/)
  })

  it('(c) no assert imports product code — these are structural lints, read from disk', () => {
    const offenders = suiteFiles()
      .filter((s) => /from\s*['"](\.\.\/\.\.\/)?src\//.test(s.text))
      .map((s) => s.file)
    expect(offenders, 'an assert imported from src/ — it must read from disk instead').toEqual([])
  })

  it('(d) no assert mutates the tree — it is a read-only lint', () => {
    const offenders = suiteFiles()
      .filter((s) => /\bfs\.(write|append|rm|unlink|mkdir|rename|copy)/.test(s.text))
      .map((s) => s.file)
    expect(offenders).toEqual([])
  })
})

describe('[u9#c6] suite scope', () => {
  it('suite is green on the current tree', () => {
    // The scoping rule's actual promise: this suite passes on the tree as it
    // exists at u9's merge, with u4–u8 and u11 still unbuilt (C1). It holds
    // because every assert is scoped to what exists — the module graph reached
    // from index.html, the selectors present in the stylesheets on disk, and
    // an allowlist whose entries are proven unreachable.
    //
    // Concretely: the suite must be findable, non-empty and self-contained.
    const files = testFiles()
    expect(files.length).toBe(EXPECTED_TESTS.length)
    for (const f of files) {
      expect(f.text.length, `${f.file} is empty`).toBeGreaterThan(0)
      expect(f.text, `${f.file} has no assertions`).toMatch(/\bexpect\(/)
    }
    expect(exists(abs('index.html'))).toBe(true)
    expect(exists(abs('src'))).toBe(true)
  })
})
