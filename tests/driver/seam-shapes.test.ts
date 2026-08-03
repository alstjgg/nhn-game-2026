// [u2#c1] + [u2#c2] + [u2#c8] — src/shared/view-driver.ts carries the §5.2 block VERBATIM
// and compiles under tsconfig.core.json as a types-only module.
//
// "Verbatim" is checked structurally: the ratified ```ts fence is lifted out of
// docs/spec-client.md §5.2, comments are stripped, whitespace/quote/semicolon
// noise is normalised away, and every one of the six declarations must appear
// in the implementation source under that same normalisation. Adding `export`
// is the only edit the unit is allowed to make.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SEAM = path.join(REPO, 'src/shared/view-driver.ts')
const SPEC = path.join(REPO, 'docs/spec-client.md')

const DECLS = ['Species', 'Sentence', 'FeedKind', 'FeedLine', 'ViewEvent', 'MembraneOp'] as const

const VIEW_EVENT_TYPES = [
  'beat_start',
  'beat_end',
  'feed',
  'waiting',
  'fallback',
  'report',
  'score',
  'run_end',
  'meta',
] as const

const MEMBRANE_OPS = ['slot', 'unslot', 'mine', 'deploy', 'new_run'] as const

function read(p: string): string {
  return fs.readFileSync(p, 'utf8')
}

/** The ratified ```ts fence that opens spec-client §5.2. */
function ratifiedFence(): string {
  const spec = read(SPEC)
  const head = spec.indexOf('### 5.2')
  expect(head, 'spec-client.md has no §5.2 heading').toBeGreaterThan(-1)
  const open = spec.indexOf('```ts', head)
  expect(open, '§5.2 has no ```ts fence').toBeGreaterThan(-1)
  const bodyStart = spec.indexOf('\n', open) + 1
  const close = spec.indexOf('```', bodyStart)
  expect(close, '§5.2 fence is unterminated').toBeGreaterThan(-1)
  return spec.slice(bodyStart, close)
}

/**
 * Comment-free, whitespace-flat, quote- and semicolon-neutral form. Two sources
 * that differ only in formatting normalise to the same string; a renamed member
 * or a widened union does not.
 */
function normalise(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\bexport\s+/g, '')
    .replace(/\bdeclare\s+/g, '')
    .replace(/"/g, "'")
    .replace(/;/g, ' ')
    .replace(/=\s*\|/g, '=')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Slice the normalised fence into one chunk per top-level declaration. */
function declarations(normalisedFence: string): Map<string, string> {
  const re = /(?:type|interface) (Species|Sentence|FeedKind|FeedLine|ViewEvent|MembraneOp)\b/g
  const heads = [...normalisedFence.matchAll(re)]
  const out = new Map<string, string>()
  heads.forEach((h, i) => {
    const start = h.index!
    const end = i + 1 < heads.length ? heads[i + 1]!.index! : normalisedFence.length
    out.set(h[1]!, normalisedFence.slice(start, end).trim())
  })
  return out
}

describe('[u2#c1] the seam module exists where §5.2 puts it', () => {
  it('(a) src/shared/view-driver.ts is present', () => {
    expect(fs.existsSync(SEAM), 'src/shared/view-driver.ts is missing').toBe(true)
  })

  it('(b) it declares all six §5.2 names', () => {
    const source = read(SEAM)
    const missing = DECLS.filter((d) => !new RegExp(`(?:type|interface)\\s+${d}\\b`).test(source))
    expect(missing).toEqual([])
  })

  it('(c) all six are exported', () => {
    const source = read(SEAM)
    const unexported = DECLS.filter(
      (d) => !new RegExp(`export\\s+(?:type|interface)\\s+${d}\\b`).test(source),
    )
    expect(unexported).toEqual([])
  })
})

describe('[u2#c1]+[u2#c8] each declaration matches the ratified fence VERBATIM', () => {
  const spec = declarations(normalise(ratifiedFence()))

  it('(d) the spec fence yields all six declarations (guards the extractor itself)', () => {
    expect([...spec.keys()].sort()).toEqual([...DECLS].sort())
  })

  for (const name of DECLS) {
    it(`(d:${name}) src/shared/view-driver.ts reproduces \`${name}\` unchanged`, () => {
      const chunk = spec.get(name)
      expect(chunk, `spec fence lost ${name}`).toBeTruthy()
      expect(normalise(read(SEAM)), `${name} deviates from the ratified §5.2 text`).toContain(chunk!)
    })
  }
})

describe('[u2#c1] union arity is exact — no member added, none dropped', () => {
  it('(e) ViewEvent carries all 8 members (9 `type` literals — beat_start/beat_end share one)', () => {
    const source = normalise(read(SEAM))
    const decl = declarations(source).get('ViewEvent') ?? ''
    for (const t of VIEW_EVENT_TYPES) {
      expect(decl, `ViewEvent is missing '${t}'`).toContain(`'${t}'`)
    }
    const members = decl.split('|').filter((m) => m.includes('type:')).length
    expect(members, 'ViewEvent must have exactly 8 union members').toBe(8)
  })

  it('(f) MembraneOp carries all 5 ops and no sixth', () => {
    const source = normalise(read(SEAM))
    const decl = declarations(source).get('MembraneOp') ?? ''
    for (const op of MEMBRANE_OPS) {
      expect(decl, `MembraneOp is missing '${op}'`).toContain(`'${op}'`)
    }
    const members = decl.split('|').filter((m) => m.includes('op:')).length
    expect(members, 'MembraneOp must have exactly 5 union members').toBe(5)
  })

  it('(g) Species is the four authored species, FeedKind the seven feed kinds', () => {
    const source = normalise(read(SEAM))
    const species = declarations(source).get('Species') ?? ''
    for (const s of ['fact', 'selfnarr', 'emotion', 'quote']) expect(species).toContain(`'${s}'`)
    expect(species.split('|').length, 'Species must have exactly 4 members').toBe(4)

    const kinds = declarations(source).get('FeedKind') ?? ''
    for (const k of ['event', 'radio', 'npc', 'symptom', 'wait', 'fallback', 'mark']) {
      expect(kinds).toContain(`'${k}'`)
    }
    expect(kinds.split('|').length, 'FeedKind must have exactly 7 members').toBe(7)
  })
})

describe('[u2#c2] the seam module is types-only and core-clean', () => {
  it('(h) it emits no runtime value — the namespace import is empty', async () => {
    const mod = (await import('../../src/shared/view-driver.ts')) as Record<string, unknown>
    expect(Object.keys(mod).filter((k) => k !== 'default' && k !== '__esModule')).toEqual([])
  })

  it('(i) source declares no runtime construct (const/let/var/function/class/enum)', () => {
    const source = normalise(read(SEAM))
    for (const kw of ['const ', 'let ', 'var ', 'function ', 'class ', 'enum ']) {
      expect(source, `view-driver.ts declares a runtime \`${kw.trim()}\``).not.toContain(kw)
    }
  })

  it('(j) it names no DOM / Node global (lib is ES2023, types is [])', () => {
    const source = read(SEAM)
    for (const g of ['document', 'window', 'HTMLElement', 'fetch', 'process', 'Buffer', 'console']) {
      expect(source, `view-driver.ts references \`${g}\``).not.toMatch(new RegExp(`\\b${g}\\b`))
    }
  })

  it('(k) it imports nothing outside src/shared', () => {
    const specs = [...read(SEAM).matchAll(/from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
    const outside = specs.filter((s) => !s.startsWith('.') || s.includes('..'))
    expect(outside, 'the seam module reaches outside src/shared').toEqual([])
  })

  it('(l) `tsc -p tsconfig.core.json --noEmit` is green with the file in scope', () => {
    expect(() =>
      execFileSync('npx', ['tsc', '-p', 'tsconfig.core.json', '--noEmit'], {
        cwd: REPO,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    ).not.toThrow()
  })
})
