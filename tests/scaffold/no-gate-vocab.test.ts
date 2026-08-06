// [G1c] spec-client §3 invariant 6 — gate structure never reaches the player,
// and `dist/` is a player surface.
//
// `published-data.test.ts` guards WHICH files ship. This guards WHAT IS INSIDE
// them. The two defects that motivated it were both inside a file that was
// entitled to ship: `gates.json` carried `standard_form` ("갈림길 G1에서, 기질은
// 기본 stance 매뉴얼 응대를 낸다; 열쇠 조건 k1을 만족하는 문장 주입 시 경청으로
// 이동한다") and `key_examples[].mined_from` ("다음 런의 G1 이전에 채굴 가능"),
// and `characters.json` carried a `strands.gate_ids` index of where each person
// sits in the gate structure.
//
// SCOPE. Every string VALUE in every published file, at any depth. Not keys —
// a key is a field name the player never sees — and not the authored files,
// which are allowed to say anything.
//
// The one exemption is `gates[].gate` itself: the engine reads a gate by id
// every run, so `"G1"` has to survive at that one path. It is exempt by PATH
// and by SHAPE (`^G\d+$` exactly), never by substring, so prose that merely
// mentions a gate cannot hide behind it.
//
// Content comes from `publishedContentOf()` — the same function the build
// plugin calls — so this cannot pass on bytes the deploy does not ship. `dist/`
// itself is deliberately not read: it is a build artifact that may be stale or
// absent, and a stale one would fail here for a reason that is not a defect.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { publishedContentOf, publishedDataFiles } from '../../vite.config.ts'

const REPO = path.resolve(import.meta.dirname, '../..')
const DATA = path.join(REPO, 'data')

/**
 * Gate vocabulary in prose. `\bgate\b` is word-bounded so `gates` — the array
 * name in the pack's own shape — does not trip it as a key; keys are not
 * scanned anyway, and the bound keeps the rule readable.
 */
const VOCAB = /갈림길|게이트|\bgate\b/i

/** A gate reference embedded anywhere in a string: `G1`, `G7`, `G12`. */
const GATE_REF = /\bG[1-9]\d*\b/

/** Exactly a gate id and nothing else. */
const BARE_GATE_ID = /^G[1-9]\d*$/

/**
 * JSON paths allowed to hold a bare gate id. Matched against the path built by
 * `walk()` below — `.gates[0].gate` normalises to `.gates[].gate`.
 */
const STRUCTURAL_PATHS = new Set(['.gates[].gate'])

type Finding = { file: string; path: string; value: string }

/** Every string value in `node`, with its normalised JSON path. */
function* walk(node: unknown, at = ''): Generator<{ path: string; value: string }> {
  if (typeof node === 'string') {
    yield { path: at, value: node }
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) yield* walk(item, `${at}[]`)
    return
  }
  if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) yield* walk(value, `${at}.${key}`)
  }
}

/** The files as they ship, parsed. */
function publishedPacks(): { rel: string; parsed: unknown }[] {
  return publishedDataFiles(REPO)
    .filter((rel) => rel.endsWith('.json'))
    .map((rel) => ({
      rel,
      parsed: JSON.parse(publishedContentOf(rel, readFileSync(path.join(DATA, rel), 'utf8'))),
    }))
}

function scan(): Finding[] {
  const findings: Finding[] = []
  for (const { rel, parsed } of publishedPacks()) {
    for (const { path: at, value } of walk(parsed)) {
      const exempt = STRUCTURAL_PATHS.has(at) && BARE_GATE_ID.test(value)
      if (exempt) continue
      if (VOCAB.test(value) || GATE_REF.test(value)) {
        findings.push({ file: rel, path: at, value })
      }
    }
  }
  return findings
}

const format = (findings: Finding[]): string =>
  findings.map((f) => `${f.file}${f.path} → ${f.value.slice(0, 90)}`).join('\n')

describe('published packs carry no gate vocabulary (inv 6)', () => {
  it('(a) the scan has something to scan — a rename cannot empty this suite', () => {
    const packs = publishedPacks()
    expect(packs.length, 'no published .json files found').toBeGreaterThan(0)
    const strings = packs.flatMap(({ parsed }) => [...walk(parsed)])
    expect(strings.length, 'published packs hold no string values').toBeGreaterThan(100)
  })

  it('(b) no published string names a gate, in vocabulary or by id', () => {
    const findings = scan()
    expect(findings, `gate structure on a published surface:\n${format(findings)}`).toEqual([])
  })

  it('(c) the structural exemption is real, narrow, and load-bearing', () => {
    // It must EXIST — if `gates[].gate` stopped being a bare id the exemption
    // would be dead code silently widening nothing.
    const gates = publishedPacks().find(({ rel }) => rel.endsWith('/gates.json'))
    expect(gates, 'no published gates.json').toBeDefined()
    const ids = [...walk(gates!.parsed)].filter((s) => s.path === '.gates[].gate')
    expect(ids.length, 'gates[].gate is not a string id any more').toBeGreaterThan(0)
    for (const { value } of ids) expect(value).toMatch(BARE_GATE_ID)

    // And it must not cover prose. A gate id inside a sentence at the exempt
    // path is still a finding, because the exemption tests the whole value.
    expect(BARE_GATE_ID.test('G1에서 기질은 매뉴얼 응대를 낸다')).toBe(false)
    expect(STRUCTURAL_PATHS.has('.gates[].standard_form')).toBe(false)
  })

  it('(d) the scan reads what ships, not what is authored', () => {
    // The authored gates.json still says everything; the published one must not.
    const authored = readFileSync(path.join(DATA, 'scenario/우는다리/gates.json'), 'utf8')
    expect(authored, 'the authored pack should still carry its design notes').toMatch(
      /"standard_form"/,
    )
    const findings: Finding[] = []
    for (const { path: at, value } of walk(JSON.parse(authored))) {
      if (VOCAB.test(value) || GATE_REF.test(value)) findings.push({ file: 'authored', path: at, value })
    }
    expect(
      findings.length,
      'the authored pack has no gate vocabulary — then this guard proves nothing',
    ).toBeGreaterThan(0)
  })
})
