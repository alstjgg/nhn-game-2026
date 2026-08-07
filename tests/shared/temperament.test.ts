// [e1] — src/shared/temperament.ts + src/shared/report-guidance.ts.
//
// The prose SHAPE is known-open (contract-engine-composer §4.1: "S + D own it,
// a work unit must not resolve it"). So nothing here asserts a template. What
// it asserts is the four §4 invariants, plus the two things that keep an
// invariant-only suite honest: the renderer must be a *function of its input*
// (a constant string would satisfy all four), and it must not silently drop
// authored content.
//
// The report-guidance renderer ships in the same unit and rides in this file on
// purpose — `plan-engine-build.md` §4a gates e1 on
// `npm test -- tests/shared/temperament.test.ts` alone, so a sibling
// report-guidance.test.ts would sit outside the unit's own gate. See
// discovery/e1.md.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Temperament } from '../../src/shared/datapack.ts'
import { renderTemperament } from '../../src/shared/temperament.ts'
import { renderReportGuidance, type ReportGuidance } from '../../src/shared/report-guidance.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8')
}

function readJson<T>(rel: string): T {
  return JSON.parse(read(rel)) as T
}

/**
 * Strip line and block comments so a source scan does not fire on prose.
 *
 * Known blind spot: this is a textual regex, not a tokenizer, so a `//`
 * inside a string or regex literal in `rel`'s source (e.g. `fetch('//host/x')`)
 * is stripped along with real comments. Both renderers are currently
 * comment-free of that shape, so it does not misfire today, but a future
 * edit that embeds a URL literal could silently escape the invariant-3(e)
 * purity scan below. Do not lean on this helper as a purity guarantee for
 * anything more sophisticated than "no clock/randomness/fs/DOM keyword".
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function firstNonEmptyLine(s: string): string {
  return s.split('\n').find((l) => l.trim() !== '') ?? ''
}

/**
 * A4 pins the header to the bold-line style of the one exemplar this unit has,
 * probe fixture `temperament/k1.md` (design decision 6): the renderer ships
 * literal `**너의 기질 — 이것은 협상 대상이 아니다.**`. This was previously widened to a
 * four-alternative regex ([기질] / 【…】 / markdown heading / bold) that let a
 * placeholder header pass — tightened back to A4's actual assertion so a
 * regression here is caught instead of silently accepted.
 */
const HEADER_LINE = /^\*\*.+\*\*$/

// ─── frozen inputs (read-only: data/scenario/**, data/policy/**) ─────────────

const PACK = readJson<Temperament>('data/scenario/우는다리/temperament.json')
const GUIDANCE = readJson<ReportGuidance>('data/policy/report-guidance.json')

const TEMPERAMENT_SRC = 'src/shared/temperament.ts'
const REPORT_GUIDANCE_SRC = 'src/shared/report-guidance.ts'

// ─── synthetic schema-valid packs ────────────────────────────────────────────

const DISPOSITION_A = '기록된 것을 믿는다. 서류에 남은 판단을 사람의 말보다 앞세운다.'
const DISPOSITION_B = '사람의 말을 믿는다. 눈앞의 목소리를 서류보다 앞세운다.'

const zeroClauses: Temperament = { default_disposition: DISPOSITION_A, clauses: [] }
const zeroClausesOtherDisposition: Temperament = {
  default_disposition: DISPOSITION_B,
  clauses: [],
}
const oneClause: Temperament = { default_disposition: DISPOSITION_A, clauses: [PACK.clauses[0]] }
const twoClauses: Temperament = {
  default_disposition: DISPOSITION_A,
  clauses: [PACK.clauses[0], PACK.clauses[1]],
}

// ═══ invariant 1 — Call 1 and Call 3 get byte-identical output ═══════════════
//
// contract-engine-composer §4 invariant 1; contract-calls §6 row `1 · 3 |
// TEMPERAMENT`. There is one temperament per scenario and two copies drift
// silently, so the two calls must be served by one renderer over one pack.

describe('[e1] invariant 1 — Calls 1 and 3 receive byte-identical temperament', () => {
  it('(a) the same pack rendered for Call 1 and for Call 3 is byte-identical', () => {
    const forCall1 = renderTemperament(PACK) // GateView.TEMPERAMENT
    const forCall3 = renderTemperament(PACK) // RoundView.TEMPERAMENT — "the SAME value"
    expect(forCall3).toBe(forCall1)
  })

  it('(b) byte-identical across a structural clone — no object-identity or cache dependence', () => {
    const clone = structuredClone(PACK)
    expect(clone).not.toBe(PACK)
    expect(renderTemperament(clone)).toBe(renderTemperament(PACK))
  })

  it('(c) the module exposes one renderer — no per-call variant to drift', () => {
    const src = stripComments(read(TEMPERAMENT_SRC))
    const exported = [...src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)].map(
      (m) => m[1],
    )
    expect(exported).toContain('renderTemperament')
    expect(exported.filter((n) => /judgment|reporter|call\s*[13]|gate|round/i.test(n))).toEqual([])
  })

  it('(d) premise: call contracts §6 still assigns TEMPERAMENT to calls 1 · 3 from one file', () => {
    const calls = read('docs/contract-calls.md')
    expect(calls).toMatch(/\|\s*1\s*·\s*3\s*\|\s*`TEMPERAMENT`\s*\|/)
  })
})

// ═══ invariant 2 — never empty ═══════════════════════════════════════════════

describe('[e1] invariant 2 — output is non-empty for any schema-valid pack', () => {
  it('(a) the authored 우는다리 pack renders non-empty', () => {
    expect(renderTemperament(PACK).trim()).not.toBe('')
  })

  it('(b) a pack with zero clauses still renders non-empty', () => {
    expect(renderTemperament(zeroClauses).trim()).not.toBe('')
  })

  it('(c) one-clause and two-clause packs render non-empty', () => {
    expect(renderTemperament(oneClause).trim()).not.toBe('')
    expect(renderTemperament(twoClauses).trim()).not.toBe('')
  })

  it('(d) malformed input never yields an empty string', () => {
    // D4 / spec S5: the renderer is total (guarded, never throws) — the header
    // alone keeps every one of these non-empty. The try/catch stays as a
    // safety net for the OTHER acceptable outcome the criterion names
    // (throwing); it should not be read as evidence that throwing occurs.
    const malformed: unknown[] = [null, undefined, {}, { default_disposition: '', clauses: [] }]
    for (const bad of malformed) {
      let out: string | undefined
      try {
        out = renderTemperament(bad as Temperament)
      } catch {
        continue // throwing would also be an acceptable outcome; returning "" is not
      }
      expect(out ?? '').not.toBe('')
      expect((out ?? '').trim()).not.toBe('')
    }
  })
})

// ═══ invariant 3 — deterministic ═════════════════════════════════════════════

describe('[e1] invariant 3 — deterministic: same pack, same string, always', () => {
  it('(a) rendered twice, byte-identical', () => {
    expect(renderTemperament(PACK)).toBe(renderTemperament(PACK))
  })

  it('(b) rendered twice, deep-equal line for line', () => {
    expect(renderTemperament(PACK).split('\n')).toEqual(renderTemperament(PACK).split('\n'))
  })

  it('(c) rendering another pack in between changes nothing — no hidden state', () => {
    const before = renderTemperament(PACK)
    renderTemperament(zeroClauses)
    renderTemperament(twoClauses)
    renderTemperament(zeroClausesOtherDisposition)
    expect(renderTemperament(PACK)).toBe(before)
  })

  it('(d) twenty renders collapse to one distinct string', () => {
    const seen = new Set(Array.from({ length: 20 }, () => renderTemperament(PACK)))
    expect(seen.size).toBe(1)
  })

  it('(e) both modules are pure — no clock, randomness, fs, network, DOM or timers', () => {
    for (const rel of [TEMPERAMENT_SRC, REPORT_GUIDANCE_SRC]) {
      const src = stripComments(read(rel))
      expect(src, `${rel} reads the clock`).not.toMatch(/\bDate\b|performance\.now/)
      expect(src, `${rel} uses randomness`).not.toMatch(/Math\.random|crypto\./)
      expect(src, `${rel} touches fs or the network`).not.toMatch(
        /node:fs|from ['"]fs['"]|\bfetch\s*\(|XMLHttpRequest/,
      )
      expect(src, `${rel} touches the DOM`).not.toMatch(/\bdocument\b|\bwindow\b|localStorage/)
      expect(src, `${rel} uses timers`).not.toMatch(/setTimeout|setInterval/)
    }
  })
})

// ═══ invariant 4 — it renders its own header ═════════════════════════════════
//
// `{TEMPERAMENT}` is a bare slot in judgment/base-v0.4.md and
// reporter/base-v0.3.md; nothing around it supplies a section header.

describe('[e1] invariant 4 — the renderer supplies its own section header', () => {
  const bareSlotTemplates = ['proxy/prompts/judgment/base-v0.4.md', 'proxy/prompts/reporter/base-v0.3.md']

  it('(a) premise: {TEMPERAMENT} sits alone on its line with no header above it', () => {
    for (const rel of bareSlotTemplates) {
      const lines = read(rel).split('\n')
      const at = lines.findIndex((l) => l.includes('{TEMPERAMENT}'))
      expect(at, `${rel} has no {TEMPERAMENT} slot`).toBeGreaterThan(-1)
      expect(lines[at].trim(), `${rel}: slot is not alone on its line`).toBe('{TEMPERAMENT}')
      expect(lines[at - 1]?.trim() ?? '', `${rel}: a header sits directly above the slot`).toBe('')
    }
  })

  it('(b) the first non-empty line of the output is a section header', () => {
    expect(firstNonEmptyLine(renderTemperament(PACK))).toMatch(HEADER_LINE)
  })

  it('(c) the header is a header, not the disposition itself', () => {
    const out = renderTemperament(PACK)
    expect(out.trimStart().startsWith(PACK.default_disposition)).toBe(false)
    expect(firstNonEmptyLine(out)).not.toContain(PACK.default_disposition)
  })

  it('(d) a zero-clause pack still gets the header', () => {
    const out = renderTemperament(zeroClauses)
    expect(firstNonEmptyLine(out)).toMatch(HEADER_LINE)
    expect(firstNonEmptyLine(out)).not.toContain(DISPOSITION_A)
  })

  it('(e) the header is the same one in both calls', () => {
    expect(firstNonEmptyLine(renderTemperament(PACK))).toBe(
      firstNonEmptyLine(renderTemperament(structuredClone(PACK))),
    )
  })
})

// ═══ the renderer reads the pack ═════════════════════════════════════════════
//
// A constant string passes invariants 1–4. These are what make the four mean
// something.

describe('[e1] the output is a function of the pack, not a constant', () => {
  it('(a) two packs differing only in default_disposition render differently', () => {
    expect(renderTemperament(zeroClauses)).not.toBe(renderTemperament(zeroClausesOtherDisposition))
  })

  it('(b) adding clauses changes the output and lengthens it', () => {
    const none = renderTemperament(zeroClauses)
    const one = renderTemperament(oneClause)
    const two = renderTemperament(twoClauses)
    expect(one).not.toBe(none)
    expect(two).not.toBe(one)
    expect(one.length).toBeGreaterThan(none.length)
    expect(two.length).toBeGreaterThan(one.length)
  })

  it('(c) the authored default_disposition survives verbatim', () => {
    expect(renderTemperament(PACK)).toContain(PACK.default_disposition)
  })

  it('(d) no authored clause is dropped — condition and defeat_condition both survive', () => {
    const out = renderTemperament(PACK)
    expect(PACK.clauses.length).toBe(2)
    for (const clause of PACK.clauses) {
      expect(out, `clause ${clause.id}: condition dropped`).toContain(clause.condition)
      expect(out, `clause ${clause.id}: defeat_condition dropped`).toContain(clause.defeat_condition)
    }
  })

  it('(e) clause order is preserved — cl1 before cl2', () => {
    const out = renderTemperament(PACK)
    expect(out.indexOf(PACK.clauses[0].condition)).toBeLessThan(
      out.indexOf(PACK.clauses[1].condition),
    )
  })

  it('(f) §4.1: the provisional shape is marked as provisional in the source', () => {
    expect(read(TEMPERAMENT_SRC)).toMatch(/provisional|잠정|§ ?4\.1/i)
  })
})

// ═══ report-guidance renderer ════════════════════════════════════════════════
//
// `{REPORT_GUIDANCE}` is Call 3's length/format policy. Unlike TEMPERAMENT the
// template already supplies its `[보고 지침]` header, so this renderer must NOT
// mint a second one.

describe('[e1] renderReportGuidance — Call 3 policy prose', () => {
  it('(a) renders non-empty for the authored policy', () => {
    expect(renderReportGuidance(GUIDANCE).trim()).not.toBe('')
  })

  it('(b) deterministic — twice byte-identical, and identical across a clone', () => {
    expect(renderReportGuidance(GUIDANCE)).toBe(renderReportGuidance(GUIDANCE))
    expect(renderReportGuidance(structuredClone(GUIDANCE))).toBe(renderReportGuidance(GUIDANCE))
    expect(renderReportGuidance(GUIDANCE).split('\n')).toEqual(
      renderReportGuidance(GUIDANCE).split('\n'),
    )
  })

  it('(c) carries every authored number: max_items, min_chars, max_chars', () => {
    const out = renderReportGuidance(GUIDANCE)
    expect(out).toContain(String(GUIDANCE.facts.max_items))
    expect(out).toContain(String(GUIDANCE.report_body.length.min_chars))
    expect(out).toContain(String(GUIDANCE.report_body.length.max_chars))
  })

  it('(d) carries both authored policy strings verbatim', () => {
    const out = renderReportGuidance(GUIDANCE)
    expect(out).toContain(GUIDANCE.facts.policy)
    expect(out).toContain(GUIDANCE.report_body.policy)
  })

  it('(e) balance-as-data: retuning the JSON retunes the prose', () => {
    const retuned: ReportGuidance = {
      ...GUIDANCE,
      facts: { ...GUIDANCE.facts, max_items: 3 },
      report_body: {
        ...GUIDANCE.report_body,
        length: { min_chars: 120, max_chars: 900 },
      },
    }
    const out = renderReportGuidance(retuned)
    expect(out).not.toBe(renderReportGuidance(GUIDANCE))
    expect(out).toContain('3')
    expect(out).toContain('900')
    expect(out).not.toContain(String(GUIDANCE.report_body.length.max_chars))
  })

  it('(f) reflects the authored body format', () => {
    expect(renderReportGuidance(GUIDANCE).toLowerCase()).toContain(
      GUIDANCE.report_body.format.toLowerCase(),
    )
  })

  it('(g) premise: the template already supplies the [보고 지침] header', () => {
    const lines = read('proxy/prompts/reporter/user-v0.3.md').split('\n')
    const at = lines.findIndex((l) => l.includes('{REPORT_GUIDANCE}'))
    expect(at).toBeGreaterThan(-1)
    expect(lines[at - 1]?.trim()).toBe('[보고 지침]')
  })

  it('(h) does not mint a second [보고 지침] header', () => {
    const out = renderReportGuidance(GUIDANCE)
    expect(firstNonEmptyLine(out).trim()).not.toBe('[보고 지침]')
    expect(out).not.toContain('[보고 지침]')
  })

  it('(i) malformed input never yields an empty string', () => {
    // D4 / spec S5: total renderer — missing facts/report_body fall back to
    // their zero values, so the fixed prose around them keeps output
    // non-empty without ever throwing. The catch below is a safety net for
    // the criterion's other acceptable outcome (throwing), not evidence that
    // this renderer throws.
    const malformed: unknown[] = [null, undefined, {}]
    for (const bad of malformed) {
      let out: string | undefined
      try {
        out = renderReportGuidance(bad as ReportGuidance)
      } catch {
        continue
      }
      expect((out ?? '').trim()).not.toBe('')
    }
  })
})

// ═══ placement ═══════════════════════════════════════════════════════════════

describe('[e1] both modules live in src/shared and stay isomorphic', () => {
  it('(a) the two source files exist at their contracted paths', () => {
    expect(fs.existsSync(path.join(REPO, TEMPERAMENT_SRC))).toBe(true)
    expect(fs.existsSync(path.join(REPO, REPORT_GUIDANCE_SRC))).toBe(true)
  })

  it('(b) neither imports outside src/shared', () => {
    for (const rel of [TEMPERAMENT_SRC, REPORT_GUIDANCE_SRC]) {
      const specifiers = [...stripComments(read(rel)).matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
        (m) => m[1],
      )
      for (const spec of specifiers) {
        expect(spec.startsWith('.'), `${rel}: bare specifier ${spec}`).toBe(true)
        expect(spec, `${rel}: escapes src/shared`).not.toMatch(/\.\.\//)
      }
    }
  })

  it('(c) report-guidance.ts exports the ReportGuidance type ComposerDeps names', () => {
    expect(read(REPORT_GUIDANCE_SRC)).toMatch(/export\s+type\s+ReportGuidance\b/)
  })
})
