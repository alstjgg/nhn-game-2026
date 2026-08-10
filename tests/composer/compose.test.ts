// [e5] — src/composer/: the three builders.
//
// Gate: `npm test -- tests/composer`. Transcribes spec A1–A19 one `it()` per
// criterion (A20's git half rides along as a frozen-path guard; A21 is a
// command gate run outside vitest).
//
// Two things this suite deliberately does NOT do:
//   · it never asserts prompt WORDING — `proxy/prompts/**` is frozen and owned
//     by the D task; A8 only asserts that nothing is left unfilled;
//   · it never normalises the payload through `JSON.parse(JSON.stringify(x))`
//     before checking key order — that would hide the very bug A3 exists for.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

import { createComposer, TEMPLATE_VERSION } from '../../src/composer/compose.ts'
import { renderTemperament } from '../../src/shared/temperament.ts'
import { renderReportGuidance } from '../../src/shared/report-guidance.ts'
import type { CallType, JudgmentSlots, NarrationSlots, ReporterSlots } from '../../src/shared/contracts.ts'
import {
  CALL_SPECS,
  renderCall,
  DEFAULT_PROMPT,
  PROMPT_BUNDLE,
  assertEnvelope,
  asProxyRequest,
  VERSION_RE,
} from './proxy-bridge.ts'
import {
  BLOCK_TEXT,
  makeBlockStore,
  makeGateView,
  makeBeatView,
  makeScriptBeatView,
  makeRoundView,
  makeReportGuidance,
  makeTemperament,
} from './fixtures.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** contract-calls §6 "Supplier per slot" — these three are the proxy's alone. */
const PROXY_OWNED = ['FLAW', 'INCIDENT', 'PRIORITY_LIST'] as const

const CALL_TYPES: CallType[] = ['judgment', 'narration', 'reporter']

const IDS_2 = ['b-r1-n02', 'b-r1-f01']
const IDS_3 = ['b-r1-a03', 'b-r1-f01', 'b-r1-n02']

function composer() {
  return createComposer({ reportGuidance: makeReportGuidance(), blocks: makeBlockStore(), pack: 'testpack' })
}

/** All three payloads from one fresh composer, keyed by call type. */
function allThree(ids: string[] = IDS_2) {
  const c = composer()
  return {
    judgment: c.judgment(makeGateView(), ids),
    narration: c.narration(makeBeatView()),
    reporter: c.reporter(makeRoundView()),
  } as Record<CallType, ReturnType<typeof c.judgment>>
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  const out: T[][] = []
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)]
    for (const tail of permutations(rest)) out.push([item, ...tail])
  })
  return out
}

// ─── A1 / A2 — §8-4 proxy-owned slots are never emitted ──────────────────────

describe('A1/A2 — §8-4: proxy-owned slots never leave the client', () => {
  it('A1 judgment emits no FLAW / INCIDENT / PRIORITY_LIST', () => {
    const req = composer().judgment(makeGateView(), IDS_2)
    const keys = Object.keys(req.slots)
    for (const owned of PROXY_OWNED) expect(keys).not.toContain(owned)

    // …and not smuggled in as an inherited or non-enumerable property either.
    const roundTripped = JSON.parse(JSON.stringify(req)) as { slots: Record<string, unknown> }
    for (const owned of PROXY_OWNED) expect(Object.keys(roundTripped.slots)).not.toContain(owned)
  })

  it('A2 narration and reporter emit none of them either', () => {
    const reqs = allThree()
    for (const t of CALL_TYPES) {
      const keys = Object.keys(reqs[t].slots)
      const roundTripped = JSON.parse(JSON.stringify(reqs[t])) as { slots: Record<string, unknown> }
      for (const owned of PROXY_OWNED) {
        expect(keys, `${t}.slots`).not.toContain(owned)
        expect(Object.keys(roundTripped.slots), `${t}.slots (round-tripped)`).not.toContain(owned)
      }
    }
  })
})

// ─── A3 / A4 / A5 — the envelope ─────────────────────────────────────────────

describe('A3–A5 — the envelope is exactly what §11 describes', () => {
  it('A3 keys are [call_type, template_version, pack, slots] in that order', () => {
    const reqs = allThree()
    for (const t of CALL_TYPES) {
      expect(Object.keys(reqs[t]), t).toEqual(['call_type', 'template_version', 'pack', 'slots'])
    }
  })

  it('A4 the slot set is exactly the contract’s — no extras, no gaps', () => {
    const reqs = allThree()
    const expected: Record<CallType, string[]> = {
      judgment: ['TEMPERAMENT', 'TIMELINE_EXCERPT', 'BLOCKS', 'GATE_QUESTION', 'STANCE_SET'],
      narration: [
        'TIMELINE_TAIL',
        'AGENT_UTTERANCE',
        'FIXED_NPC_ACTION',
        'SCENE_SYMPTOMS',
        'PRESENT_NPCS',
      ],
      reporter: ['EXPERIENCED', 'TEMPERAMENT', 'REPORT_GUIDANCE'],
    }
    for (const t of CALL_TYPES) {
      expect(new Set(Object.keys(reqs[t].slots)), t).toEqual(new Set(expected[t]))
      expect(Object.keys(reqs[t].slots).length, `${t} has no duplicate/extra slot`).toBe(
        expected[t].length,
      )
    }
  })

  it('A5 template_version is per call type and both prompt layers exist at it', () => {
    const reqs = allThree()
    // x12 — bumped onto PR #234's prompts (민서, 08-10). The literals are
    // deliberately spelled out rather than read from `TEMPLATE_VERSION`: this
    // assert exists to make a version bump a decision someone takes on purpose,
    // and a test that derived them would agree with any value the constant held.
    // The loop below is what proves the version is real — both prompt layers
    // must be in the bundle at it, which is the check that would have caught a
    // client asking the proxy for something it cannot serve.
    expect(reqs.judgment.template_version).toBe('v0.5')
    expect(reqs.narration.template_version).toBe('v0.4')
    expect(reqs.reporter.template_version).toBe('v0.4')

    for (const t of CALL_TYPES) {
      const v = reqs[t].template_version
      expect(TEMPLATE_VERSION[t], `TEMPLATE_VERSION.${t}`).toBe(v)
      expect(VERSION_RE.test(v), `${t} version shape`).toBe(true)
      expect(PROMPT_BUNDLE[`${t}/base-${v}`], `${t}/base-${v}`).toBeTypeOf('string')
      expect(PROMPT_BUNDLE[`${t}/user-${v}`], `${t}/user-${v}`).toBeTypeOf('string')
    }
  })
})

// ─── A6 / A7 / A8 — §8-7 through the proxy's own validators, offline ─────────

describe('A6–A8 — §8-7: the proxy accepts the composed payload', () => {
  it('A6 the envelope passes parseCallRequest’s four checks', () => {
    const reqs = allThree()
    for (const t of CALL_TYPES) {
      expect(assertEnvelope(reqs[t]), t).toEqual([])
      // And once across the wire, where only JSON survives.
      expect(assertEnvelope(JSON.parse(JSON.stringify(reqs[t]))), `${t} round-tripped`).toEqual([])
    }
  })

  it('A7 buildTool accepts the slots; judgment’s stance enum is the stance set', () => {
    const view = makeGateView()
    const c = composer()
    const reqs: Record<CallType, unknown> = {
      judgment: c.judgment(view, IDS_2),
      narration: c.narration(makeBeatView()),
      reporter: c.reporter(makeRoundView()),
    }
    for (const t of CALL_TYPES) {
      expect(() => CALL_SPECS[t].buildTool(asProxyRequest(reqs[t]).slots), t).not.toThrow()
    }

    const tool = CALL_SPECS.judgment.buildTool(asProxyRequest(reqs.judgment).slots)
    const schema = tool.inputSchema as {
      properties: { stance: { enum: string[] } }
    }
    expect(schema.properties.stance.enum).toEqual(view.STANCE_SET.map((s) => s.id))
  })

  it('A8 renderCall produces two non-empty messages with no marker left over', () => {
    const reqs = allThree()
    for (const t of CALL_TYPES) {
      const rendered = renderCall(asProxyRequest(reqs[t]), DEFAULT_PROMPT as unknown as Record<string, unknown>)
      expect(rendered.system.length, `${t}.system`).toBeGreaterThan(0)
      expect(rendered.user.length, `${t}.user`).toBeGreaterThan(0)
      expect(rendered.system.match(/\{[A-Z_]+\}/), `${t}.system marker`).toBeNull()
      expect(rendered.user.match(/\{[A-Z_]+\}/), `${t}.user marker`).toBeNull()
    }
  })

  it('A8b a script beat (AGENT_UTTERANCE: "") still renders — S4', () => {
    const req = composer().narration(makeScriptBeatView())
    expect((req.slots as NarrationSlots).AGENT_UTTERANCE).toBe('')
    const rendered = renderCall(asProxyRequest(req), DEFAULT_PROMPT as unknown as Record<string, unknown>)
    expect(rendered.user.match(/\{[A-Z_]+\}/)).toBeNull()
    expect(rendered.user.length).toBeGreaterThan(0)
  })
})

// ─── A9–A13 — block-id resolution and canonical order ────────────────────────

describe('A9–A13 — §8-10: same block set ⇒ same bytes', () => {
  it('A9 order of the injected ids does not change a byte', () => {
    const c = composer()
    const a = JSON.stringify(c.judgment(makeGateView(), ['b-r1-n02', 'b-r1-f01']))
    const b = JSON.stringify(c.judgment(makeGateView(), ['b-r1-f01', 'b-r1-n02']))
    expect(a).toBe(b)

    const perms = permutations(IDS_3)
    expect(perms.length).toBe(6)
    const bytes = perms.map((ids) => JSON.stringify(composer().judgment(makeGateView(), ids)))
    for (const [i, s] of bytes.entries()) expect(s, `permutation ${i}`).toBe(bytes[0])
  })

  it('A10 canonical order is lexicographic by id, UTF-16 code unit', () => {
    const ids = ['블럭-01', 'b-r1-n02', 'B-upper', 'b-r1-f01']
    const req = composer().judgment(makeGateView(), ids)
    expect((req.slots as JudgmentSlots).BLOCKS.map((b) => b.id)).toEqual([...new Set(ids)].sort())
  })

  it('A10b `localeCompare` order is NOT what the composer produces', () => {
    // A guard against "make it read nicer" — the two orders must be visibly
    // different for this fixture, so a swap to localeCompare fails A10 loudly.
    const ids = ['블럭-01', 'B-upper', 'b-r1-f01']
    const codeUnit = [...ids].sort()
    const locale = [...ids].sort((x, y) => x.localeCompare(y))
    expect(codeUnit).not.toEqual(locale)
    const req = composer().judgment(makeGateView(), ids)
    expect((req.slots as JudgmentSlots).BLOCKS.map((b) => b.id)).toEqual(codeUnit)
  })

  it('A11 duplicate ids collapse and change nothing', () => {
    const c = composer()
    const dup = c.judgment(makeGateView(), ['b-r1-f01', 'b-r1-f01', 'b-r1-n02'])
    const once = c.judgment(makeGateView(), ['b-r1-f01', 'b-r1-n02'])
    expect((dup.slots as JudgmentSlots).BLOCKS.length).toBe(2)
    expect(JSON.stringify(dup)).toBe(JSON.stringify(once))
  })

  it('A12 an empty block set is legal and renders as (없음)', () => {
    const req = composer().judgment(makeGateView(), [])
    expect((req.slots as JudgmentSlots).BLOCKS).toEqual([])
    expect(assertEnvelope(req)).toEqual([])
    expect(() => CALL_SPECS.judgment.buildTool(asProxyRequest(req).slots)).not.toThrow()
    const rendered = renderCall(asProxyRequest(req), DEFAULT_PROMPT as unknown as Record<string, unknown>)
    expect(rendered.user.match(/\{[A-Z_]+\}/)).toBeNull()
    expect(`${rendered.system}\n${rendered.user}`).toContain('(없음)')
  })

  it('A13 an unresolved id throws, naming the id, emitting nothing partial', () => {
    const c = composer()
    let thrown: unknown
    try {
      c.judgment(makeGateView(), ['b-r1-f01', 'nope'])
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toContain('nope')

    // Resolve-all-then-emit (D5): the throw must not have left the composer in
    // a state where the next good call is contaminated.
    const after = c.judgment(makeGateView(), ['b-r1-f01'])
    expect((after.slots as JudgmentSlots).BLOCKS).toEqual([
      { id: 'b-r1-f01', text: BLOCK_TEXT['b-r1-f01'] },
    ])
  })
})

// ─── A14–A16 — values stay values; only two slots are prose ──────────────────

describe('A14–A16 — structured stays structured, prose comes from e1', () => {
  it('A14 BLOCKS carries resolved {id,text}; no slot is pre-joined prose', () => {
    const req = composer().judgment(makeGateView(), IDS_2)
    const slots = req.slots as JudgmentSlots
    expect(slots.BLOCKS).toEqual(
      [...new Set(IDS_2)].sort().map((id) => ({ id, text: BLOCK_TEXT[id] })),
    )
    for (const block of slots.BLOCKS) expect(Object.keys(block)).toEqual(['id', 'text'])

    const reqs = allThree()
    const mustStayArrays: Array<[CallType, string]> = [
      ['judgment', 'BLOCKS'],
      ['judgment', 'STANCE_SET'],
      ['judgment', 'TIMELINE_EXCERPT'],
      ['narration', 'TIMELINE_TAIL'],
      ['narration', 'SCENE_SYMPTOMS'],
      ['narration', 'PRESENT_NPCS'],
      ['reporter', 'EXPERIENCED'],
    ]
    for (const [t, name] of mustStayArrays) {
      const value = (reqs[t].slots as unknown as Record<string, unknown>)[name]
      expect(Array.isArray(value), `${t}.${name} must stay an array`).toBe(true)
    }
  })

  it('A15 TEMPERAMENT is renderTemperament’s output, uncached and unedited', () => {
    const pack = makeTemperament()
    const gate = makeGateView()
    gate.TEMPERAMENT = pack
    const round = makeRoundView()
    round.TEMPERAMENT = pack
    const c = composer()

    const j = (c.judgment(gate, IDS_2).slots as JudgmentSlots).TEMPERAMENT
    const r = (c.reporter(round).slots as ReporterSlots).TEMPERAMENT
    expect(typeof j).toBe('string')
    expect(typeof r).toBe('string')
    expect(j).toBe(renderTemperament(pack))
    expect(r).toBe(renderTemperament(pack))
    expect(j).toBe(r) // "the SAME value Call 1 received, byte for byte"

    // Not cached: a different pack must produce a different string.
    const other = makeTemperament()
    other.default_disposition = '너는 먼저 움직인다.'
    const gate2 = makeGateView()
    gate2.TEMPERAMENT = other
    expect((c.judgment(gate2, IDS_2).slots as JudgmentSlots).TEMPERAMENT).toBe(
      renderTemperament(other),
    )
  })

  it('A16 REPORT_GUIDANCE is renderReportGuidance’s prose, never [object Object]', () => {
    const guidance = makeReportGuidance()
    const c = createComposer({ reportGuidance: guidance, blocks: makeBlockStore(), pack: 'testpack' })
    const value = (c.reporter(makeRoundView()).slots as ReporterSlots).REPORT_GUIDANCE
    expect(typeof value).toBe('string')
    expect(value).toBe(renderReportGuidance(guidance))
    expect(value).not.toContain('[object Object]')
  })
})

// ─── A17 — purity: the payload is a copy, not a window on the view ───────────

describe('A17 — the composed payload is independent of the view', () => {
  it('mutating the view after composing leaves the payload byte-identical', () => {
    const c = composer()

    const gate = makeGateView()
    const judgment = c.judgment(gate, IDS_2)
    const judgmentBytes = JSON.stringify(judgment)
    gate.STANCE_SET.push({ id: 'flee', label: '물러난다' })
    gate.TIMELINE_EXCERPT.splice(0, 1)
    gate.TEMPERAMENT.clauses.splice(0, 1)
    expect(JSON.stringify(judgment)).toBe(judgmentBytes)

    const beat = makeBeatView()
    const narration = c.narration(beat)
    const narrationBytes = JSON.stringify(narration)
    beat.PRESENT_NPCS.push({ id: 'x', name: 'X', side: 'room' })
    beat.SCENE_SYMPTOMS.splice(0, 1)
    beat.TIMELINE_TAIL.push('03:99 없었던 일.')
    expect(JSON.stringify(narration)).toBe(narrationBytes)

    const round = makeRoundView()
    const reporter = c.reporter(round)
    const reporterBytes = JSON.stringify(reporter)
    round.EXPERIENCED.splice(0, 2)
    expect(JSON.stringify(reporter)).toBe(reporterBytes)
  })
})

// ─── A18 / A19 — source scans ────────────────────────────────────────────────

/** Strip line and block comments so a prose mention does not fire a scan. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Drop `import type …` statements — type-only imports carry no runtime edge. */
function stripTypeImports(source: string): string {
  return source.replace(/^\s*import\s+type\b[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
}

function composerSources(): Array<{ rel: string; code: string }> {
  const dir = path.join(REPO, 'src/composer')
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({
      rel: `src/composer/${f}`,
      code: stripComments(fs.readFileSync(path.join(dir, f), 'utf8')),
    }))
}

describe('A18/A19 — the composer is pure and datapack-blind', () => {
  it('A18 no forbidden global and no cross-module value import', () => {
    const files = composerSources()
    expect(files.map((f) => f.rel)).toContain('src/composer/compose.ts')

    const forbidden: Array<[string, RegExp]> = [
      ['fetch', /\bfetch\s*\(/],
      ['Date', /\bDate\b/],
      ['Math.random', /\bMath\s*\.\s*random\b/],
      ['setTimeout', /\bsetTimeout\b/],
      ['document', /\bdocument\b/],
      ['window', /\bwindow\b/],
      ['node:fs', /node:fs/],
    ]
    for (const { rel, code } of files) {
      for (const [name, re] of forbidden) {
        expect(re.test(code), `${rel} must not use ${name}`).toBe(false)
      }
    }

    const bannedImport = /(^|\/)(engine|client|driver)\//
    for (const { rel, code } of files) {
      const runtime = stripTypeImports(code)
      const sources = [...runtime.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      for (const spec of sources) {
        expect(bannedImport.test(spec), `${rel} value-imports ${spec}`).toBe(false)
        expect(spec.includes('proxy/'), `${rel} value-imports ${spec}`).toBe(false)
        expect(spec.includes('tools/'), `${rel} value-imports ${spec}`).toBe(false)
      }
    }
  })

  it('A19 the composer never reads the datapack (§7)', () => {
    for (const { rel, code } of composerSources()) {
      const runtime = stripTypeImports(code)
      const sources = [...runtime.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      for (const spec of sources) {
        expect(spec.includes('datapack'), `${rel} value-imports ${spec}`).toBe(false)
      }
      expect(/['"][^'"]*\bdata\//.test(runtime), `${rel} names a data/ path`).toBe(false)
      expect(/\bJSON\s*\.\s*parse\b/.test(runtime), `${rel} parses JSON`).toBe(false)
    }
  })
})

// ─── A20 (git half) — the frozen mirrors are untouched ───────────────────────

describe('A20 — D3 prompt byte-parity inputs stay frozen', () => {
  // NARROWED (08-09) from all of `proxy/` to the surfaces byte-parity actually
  // rests on: the two renderers, the templates they read, and the generated
  // bundle between them. What this guard is for is the ⚠️ in §10 — the probe
  // keeps its own renderer, and if the two drift the measurements stop
  // describing the deployed system. `proxy/src/{types,handler,call-service}.ts`
  // are none of those; a per-scenario default prompt reaches Call 1 through a
  // route this guard was never watching.
  //
  // Two things make the narrowing safe rather than convenient. The direct check
  // exists: `proxy/tests/prompt-parity.test.ts` composes a suite through both
  // renderers and fails on any difference, which is a stronger statement than
  // "nobody touched the files". And this one is scoped to the WORKING TREE —
  // it goes quiet the moment a change is committed, so read as a freeze over
  // the whole tier it was never a gate, only a tripwire on the way past.
  const PARITY_INPUTS = [
    'proxy/prompts',
    'proxy/src/prompt.ts',
    'proxy/src/prompt-bundle.generated.ts',
    'proxy/src/calls.ts',
    'tools/lib/compose.mjs',
    'tools/lib/calls.mjs',
  ]

  it('this unit changes nothing the probe and the proxy must render identically', () => {
    const out = execFileSync('git', ['status', '--porcelain', '--', ...PARITY_INPUTS], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim()
    expect(out, `frozen paths modified:\n${out}`).toBe('')
  })
})
