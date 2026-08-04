#!/usr/bin/env node
// e9 — `tools/driver/drive-run.mjs` conformance suite (TDD red).
//
//   node --test --experimental-strip-types "tools/tests/*.mjs"
//   (auto-collected by `npm run test:shared`, therefore by `npm run check` — A9)
//
// Offline, no network, no key: every run here is against e6's fixture provider
// and e8's in-memory meta store. Zero dependencies beyond `node:test`.
//
// WHAT THIS SUITE IS GUARDING. drive-run is a *recorder*, not an engine. Every
// assertion below is either (a) the emitted record conforms to the frozen
// `run-record.schema.json`, (b) the same inputs produce byte-identical bytes,
// or (c) drive-run did not grow a second copy of something `src/**` already
// owns. Anything drive-run computes that the engine already computes is a
// defect, and the A5–A8 source guards at the bottom are how that stays true
// without a human re-reading the file every merge.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
  assembleRecord,
  bindRun,
  persistRun,
  provenanceOf,
  runHeadless,
  validateRunRecord,
  firstDiff,
  reduceEvents,
  recordingTransport,
  loadPack,
  loadGuidance,
} from '../driver/drive-run.mjs'

import { createFixtureProvider } from '../../src/transport/fixture.ts'
import { createMemoryMetaStore } from '../../src/runloop/store.ts'
import { validate as validateAgainst, loadSchema } from '../driver/run/schema.ts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../..')
const SCRIPT = path.join(REPO, 'tools/driver/drive-run.mjs')
const PACK = '우는다리'
const RUN_SCHEMA_PATH = path.join(REPO, 'data/runs/_schema/run-record.schema.json')
const META_SCHEMA_PATH = path.join(REPO, 'data/runs/_schema/meta-state.schema.json')

const RUN_SCHEMA = JSON.parse(fs.readFileSync(RUN_SCHEMA_PATH, 'utf8'))
const GATES = JSON.parse(fs.readFileSync(path.join(REPO, 'data/scenario', PACK, 'gates.json'), 'utf8')).gates

/** gate id → the stance ids the pack authorises for it (A10's "stance set"). */
const STANCE_SET = new Map(GATES.map((g) => [g.gate, new Set(g.stances.map((s) => s.id))]))

/** decision 3 — the compared byte string, key order included. */
const serialize = (record) => `${JSON.stringify(record, null, 2)}\n`

/** One headless pass with the fixture provider and a fresh in-memory store. */
async function pass(overrides, runId = `${PACK}-fixture-r1`) {
  return runHeadless({
    pack: loadPack(PACK),
    guidance: loadGuidance(),
    provider: createFixtureProvider(overrides),
    store: createMemoryMetaStore(),
    runId,
  })
}

/**
 * Spawn the CLI the way A1/A3 spell it, inheriting this node's exec flags.
 * `opts.script` points the run at a copy of the tool elsewhere (the ship test).
 */
function cli(args, opts = {}) {
  const { script = SCRIPT, ...spawnOpts } = opts
  return spawnSync(process.execPath, [...process.execArgv, script, ...args], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 30_000,
    ...spawnOpts,
  })
}

function tmpOut(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `e9-${tag}-`))
}

/** A deep clone with one JSON-pointer-ish path overwritten — corruption helper. */
function corrupt(record, mutate) {
  const copy = JSON.parse(JSON.stringify(record))
  mutate(copy)
  return copy
}

// ─────────────────────────────────────────────────────────────────────────────
// A1 · A3 — the two acceptance commands, exactly as the unit spells them
// ─────────────────────────────────────────────────────────────────────────────
describe('A1 — the --validate command', () => {
  // Review finding D. This test used to invoke the CLI with no `--out`, so
  // `npm run check` rewrote the tracked sample in place and then asserted it
  // existed — the artifact confirmed itself and nothing was ever compared. The
  // run now goes to a temp dir and the committed sample is the expectation.
  test('exits 0 and writes <out>/<run_id>.json, byte-identical to the committed sample', () => {
    const out = tmpOut('a1')
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--validate', `--out=${out}`])
    assert.equal(res.status, 0, `stderr:\n${res.stderr}`)

    const written = path.join(out, `${PACK}-fixture-r1.json`)
    assert.ok(fs.existsSync(written), `expected ${written} to exist`)

    const committed = path.join(REPO, 'artifacts/runs', `${PACK}-fixture-r1.json`)
    assert.ok(fs.existsSync(committed), `the reviewable sample ${committed} is missing`)

    const fresh = fs.readFileSync(written, 'utf8')
    const sample = fs.readFileSync(committed, 'utf8')
    const diff = firstDiff(JSON.parse(sample), JSON.parse(fresh))
    assert.equal(
      diff,
      null,
      `the committed sample no longer matches a fresh run (first difference: ${diff}). ` +
        'If the change is intended, regenerate it deliberately: ' +
        'node tools/driver/drive-run.mjs --pack 우는다리 --provider fixture --validate',
    )
    assert.equal(fresh, sample, 'the sample must match byte for byte, key order included')
  })

  test('the tracked sample is left alone by the suite — no test rewrites it', () => {
    const committed = path.join(REPO, 'artifacts/runs', `${PACK}-fixture-r1.json`)
    const before = fs.readFileSync(committed)
    const out = tmpOut('untouched')
    assert.equal(cli(['--pack', PACK, '--provider', 'fixture', `--out=${out}`]).status, 0)
    assert.deepEqual(fs.readFileSync(committed), before)
    const sources = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
    // Only real invocations: the literal must open with a quoted argument.
    for (const [, args] of sources.matchAll(/cli\(\['([^\]]*)\]/g)) {
      assert.match(
        args,
        // `--help`, `--determinism-check` and the two rejected-argument cases
        // all return before the write path; everything else must name a --out.
        /--out|--help|--determinism-check|--nope|__no_such_provider__/,
        `this suite invokes the CLI without --out, so it writes into artifacts/runs: ${args}`,
      )
    }
  })

  test('the written file is exactly JSON.stringify(record, null, 2) + newline', () => {
    const out = tmpOut('ser')
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--validate', `--out=${out}`])
    assert.equal(res.status, 0, res.stderr)
    const [file] = fs.readdirSync(out)
    const text = fs.readFileSync(path.join(out, file), 'utf8')
    assert.equal(text, serialize(JSON.parse(text)))
  })

  test('--pack=<slug> and --pack <slug> are the same invocation', () => {
    const a = tmpOut('eq-a')
    const b = tmpOut('eq-b')
    assert.equal(cli(['--pack', PACK, '--provider', 'fixture', `--out=${a}`]).status, 0)
    assert.equal(cli([`--pack=${PACK}`, '--provider=fixture', `--out=${b}`]).status, 0)
    const read = (d) => fs.readFileSync(path.join(d, fs.readdirSync(d)[0]), 'utf8')
    assert.equal(read(a), read(b))
  })
})

describe('A3 — the --determinism-check command', () => {
  test('exits 0 on two in-process passes over the fixture provider', () => {
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--determinism-check'])
    assert.equal(res.status, 0, `stderr:\n${res.stderr}`)
  })

  test('two runHeadless passes serialize byte-identically', async () => {
    const a = await pass()
    const b = await pass()
    assert.equal(serialize(a.record), serialize(b.record))
  })

  test('key order is part of the identity, not just deep equality', async () => {
    const a = await pass()
    const b = await pass()
    assert.deepEqual(Object.keys(a.record), Object.keys(b.record))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A2 — schema conformance, and a corrupted field is caught
// ─────────────────────────────────────────────────────────────────────────────
describe('A2 — validateRunRecord', () => {
  test('the emitted record conforms — no errors and no unimplemented keywords', async () => {
    const { record } = await pass()
    const res = validateRunRecord(record)
    assert.deepEqual(res.errors, [], 'record must conform')
    assert.deepEqual(res.unimplemented, [], 'a walker that skips a keyword is vacuous')
  })

  test('a corrupted reached_clock is rejected ($ref → #/$defs/clockTime must be enforced)', async () => {
    const { record } = await pass()
    const bad = corrupt(record, (r) => { r.reached_clock = '25:99' })
    const res = validateRunRecord(bad)
    assert.notEqual(res.errors.length, 0)
    assert.deepEqual(res.unimplemented, [], '$ref must be implemented, not reported unimplemented')
  })

  test('a missing required key is rejected', async () => {
    const { record } = await pass()
    const bad = corrupt(record, (r) => { delete r.timeline })
    assert.notEqual(validateRunRecord(bad).errors.length, 0)
  })

  test('an additional property is rejected (additionalProperties:false)', async () => {
    const { record } = await pass()
    const bad = corrupt(record, (r) => { r.wall_clock_ms = 1234 })
    assert.notEqual(validateRunRecord(bad).errors.length, 0)
  })

  test('array-form "type" is enforced, not skipped — policy:42 is rejected', async () => {
    const { record } = await pass()
    const bad = corrupt(record, (r) => { r.policy = 42 })
    const res = validateRunRecord(bad)
    assert.notEqual(res.errors.length, 0, '["string","null"] must reject a number')
    assert.deepEqual(res.unimplemented, [])
  })

  test('"enum" is enforced — fallbacks[].call outside 1|2|3 is rejected', () => {
    const bad = {
      run_id: 'x', pack_slug: PACK, policy: null, reached_clock: '09:25',
      injected_blocks: [], beats: [], timeline: ['a'],
      reports: { facts: ['a'], report_body: 'b' },
      score: null,
      fallbacks: [{ beat: 1, call: 4, code: 'timeout' }],
    }
    const res = validateRunRecord(bad)
    assert.notEqual(res.errors.length, 0, 'enum must reject call:4')
    assert.deepEqual(res.unimplemented, [], 'enum must be implemented, not reported unimplemented')
  })

  test('every keyword the frozen schema uses is implemented by the walker', async () => {
    const { record } = await pass()
    const res = validateAgainst(loadSchema(RUN_SCHEMA_PATH), record)
    assert.deepEqual(res.unimplemented, [])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A4 — a seeded difference is caught, and reported as a path
// ─────────────────────────────────────────────────────────────────────────────
describe('A4 — firstDiff', () => {
  test('identical records diff to null', async () => {
    const { record } = await pass()
    assert.equal(firstDiff(record, JSON.parse(JSON.stringify(record))), null)
  })

  test('a nested difference is reported as a JSON path naming the differing field', async () => {
    const { record } = await pass()
    assert.ok(record.beats.length > 0, 'precondition: beats non-empty')
    const bad = corrupt(record, (r) => { r.beats[0].stance = '__seeded__' })
    const diff = firstDiff(record, bad)
    assert.equal(typeof diff, 'string')
    assert.match(diff, /beats/)
    assert.match(diff, /stance/)
  })

  test('the FIRST difference wins — an earlier path is reported over a later one', async () => {
    const { record } = await pass()
    const bad = corrupt(record, (r) => {
      r.run_id = `${r.run_id}__seeded`
      r.timeline[0] = '__seeded__'
    })
    assert.match(firstDiff(record, bad), /run_id/)
  })

  test('a length difference is a difference, not a silent truncation', async () => {
    const { record } = await pass()
    const bad = corrupt(record, (r) => { r.timeline.push('__extra__') })
    assert.notEqual(firstDiff(record, bad), null)
  })

  test('a seeded provider difference makes the two passes diverge', async () => {
    const a = await pass()
    const b = await pass({ reporter: { facts: ['__seeded__'], report_body: '__seeded__' } })
    const diff = firstDiff(a.record, b.record)
    assert.notEqual(diff, null, 'a seeded pass-2 difference must not compare equal')
    assert.notEqual(serialize(a.record), serialize(b.record))
  })

  test('--determinism-check prints a path, not a whole-record dump, when it fails', () => {
    // The failure channel must be a path. Guarded via the flag's own help text
    // so the contract is visible even on a green run.
    const res = cli(['--help'])
    assert.equal(res.status, 0)
    assert.match(res.stdout, /--determinism-check/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A10 — beats
// ─────────────────────────────────────────────────────────────────────────────
describe('A10 — beats[]', () => {
  test('is non-empty', async () => {
    const { record } = await pass()
    assert.ok(record.beats.length > 0)
  })

  test('beat numbers start at 1 and increase by 1', async () => {
    const { record } = await pass()
    assert.deepEqual(record.beats.map((b) => b.beat), record.beats.map((_, i) => i + 1))
  })

  test('a gate beat has a /^G[0-9]+$/ gate and a stance drawn from that gate\'s stance set', async () => {
    const { record } = await pass()
    const gateBeats = record.beats.filter((b) => b.gate !== null)
    assert.ok(gateBeats.length > 0, 'a full run must execute at least one gate beat')
    for (const b of gateBeats) {
      assert.match(b.gate, /^G[0-9]+$/)
      assert.notEqual(b.stance, null, `${b.gate}: a gate beat must carry the Call 1 stance`)
      const allowed = STANCE_SET.get(b.gate)
      assert.ok(allowed, `${b.gate} is not a gate in the pack`)
      assert.ok(allowed.has(b.stance), `${b.gate}: stance "${b.stance}" is not in the pack's stance set`)
    }
  })

  test('gate and stance are both null or both set — never one of the two', async () => {
    const { record } = await pass()
    for (const b of record.beats) {
      assert.equal(b.gate === null, b.stance === null, `beat ${b.beat}: gate/stance nullity must be paired`)
    }
  })

  test('deltas are the engine journal\'s shape, with numeric before/after', async () => {
    const { record } = await pass()
    for (const b of record.beats) {
      assert.ok(Array.isArray(b.deltas))
      for (const d of b.deltas) {
        assert.deepEqual(Object.keys(d).sort(), ['after', 'before', 'cause', 'variable'])
        assert.equal(typeof d.variable, 'string')
        assert.equal(typeof d.cause, 'string')
        assert.equal(typeof d.before, 'number', 'boolean deltas are coerced at the boundary (D-3)')
        assert.equal(typeof d.after, 'number')
      }
    }
  })

  test('at least one delta is recorded — an empty journal would mean nothing was read', async () => {
    const { record } = await pass()
    assert.ok(record.beats.some((b) => b.deltas.length > 0), 'the journal read-through produced nothing')
  })

  test('every beat clock, when present, is a clockTime', async () => {
    const { record } = await pass()
    for (const b of record.beats) {
      if (b.clock !== null) assert.match(b.clock, /^([01][0-9]|2[0-3]):[0-5][0-9]\+?$/)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A11 — timeline
// ─────────────────────────────────────────────────────────────────────────────
describe('A11 — timeline[]', () => {
  test('is non-empty and every entry is a non-empty string', async () => {
    const { record } = await pass()
    assert.ok(record.timeline.length > 0)
    for (const line of record.timeline) {
      assert.equal(typeof line, 'string')
      assert.notEqual(line.length, 0)
    }
  })

  test('is every emitted FeedLine.text in emission order, empties dropped — no kind filter', async () => {
    const { record, events } = await pass()
    const expected = events
      .filter((e) => e.type === 'feed')
      .map((e) => e.line.text)
      .filter((t) => t.length > 0)
    assert.deepEqual(record.timeline, expected)
  })

  test('reduceEvents derives the same timeline from a raw event stream', async () => {
    const { record, events } = await pass()
    assert.deepEqual(reduceEvents(events).timeline, record.timeline)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A12 — reports are the Call 3 payload verbatim
// ─────────────────────────────────────────────────────────────────────────────
describe('A12 — reports are verbatim, never re-derived', () => {
  test('report_body is byte-equal to what the transport returned', async () => {
    const inner = createFixtureProvider()
    const wrapped = recordingTransport(inner)
    const { record } = await runHeadless({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: wrapped.transport,
      store: createMemoryMetaStore(),
      runId: `${PACK}-fixture-r1`,
    })
    assert.equal(record.reports.report_body, wrapped.calls.reportBody)
  })

  test('facts is byte-equal to what the transport returned', async () => {
    const wrapped = recordingTransport(createFixtureProvider())
    const { record } = await runHeadless({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: wrapped.transport,
      store: createMemoryMetaStore(),
      runId: `${PACK}-fixture-r1`,
    })
    assert.deepEqual(record.reports.facts, wrapped.calls.facts)
  })

  test('a multi-line markdown body survives intact — not rejoined from segmented sentences', async () => {
    const body = ['## 야간 근무 보고', '', '첫 문장이다. 둘째 문장이다.', '', '- 항목 하나'].join('\n')
    const { record } = await pass({ reporter: { facts: ['사실 하나.', '사실 둘.'], report_body: body } })
    assert.equal(record.reports.report_body, body)
    assert.deepEqual(record.reports.facts, ['사실 하나.', '사실 둘.'])
  })

  test('recordingTransport passes the inner result through unchanged', async () => {
    const inner = createFixtureProvider()
    const wrapped = recordingTransport(inner)
    const request = {
      call_type: 'reporter',
      slots: { EXPERIENCED: ['한 줄'], TEMPERAMENT: null },
    }
    const [direct, viaWrapper] = await Promise.all([inner.send(request), wrapped.transport.send(request)])
    assert.deepEqual(viaWrapper, direct)
  })

  test('recordingTransport captures the Call 1 stance', async () => {
    const wrapped = recordingTransport(createFixtureProvider())
    await runHeadless({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: wrapped.transport,
      store: createMemoryMetaStore(),
      runId: `${PACK}-fixture-r1`,
    })
    assert.equal(typeof wrapped.calls.stance, 'string')
    assert.notEqual(wrapped.calls.stance.length, 0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A13 — --emit-meta
// ─────────────────────────────────────────────────────────────────────────────
describe('A13 — meta-state', () => {
  test('runHeadless returns a meta that conforms to meta-state.schema.json', async () => {
    const { meta } = await pass()
    const res = validateAgainst(loadSchema(META_SCHEMA_PATH), meta)
    assert.deepEqual(res.errors, [])
    assert.deepEqual(res.unimplemented, [])
  })

  test('--emit-meta writes a second file beside the record', () => {
    const out = tmpOut('meta-on')
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--emit-meta', `--out=${out}`])
    assert.equal(res.status, 0, res.stderr)
    const files = fs.readdirSync(out).sort()
    assert.equal(files.length, 2, `expected record + meta, got ${files.join(', ')}`)
    const metaFile = files.find((f) => f !== `${PACK}-fixture-r1.json`)
    const meta = JSON.parse(fs.readFileSync(path.join(out, metaFile), 'utf8'))
    assert.deepEqual(validateAgainst(loadSchema(META_SCHEMA_PATH), meta).errors, [])
  })

  test('absent the flag, no meta file is written', () => {
    const out = tmpOut('meta-off')
    const res = cli(['--pack', PACK, '--provider', 'fixture', `--out=${out}`])
    assert.equal(res.status, 0, res.stderr)
    assert.deepEqual(fs.readdirSync(out), [`${PACK}-fixture-r1.json`])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A14 — CLI surface
// ─────────────────────────────────────────────────────────────────────────────
describe('A14 — CLI', () => {
  test('--help exits 0 and prints usage', () => {
    const res = cli(['--help'])
    assert.equal(res.status, 0)
    assert.match(res.stdout, /usage/i)
    assert.match(res.stdout, /drive-run\.mjs/)
  })

  test('an unknown flag exits non-zero', () => {
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--nope'])
    assert.notEqual(res.status, 0)
  })

  test('an unknown pack exits non-zero rather than emitting a record', () => {
    const out = tmpOut('badpack')
    const res = cli(['--pack', '__no_such_pack__', '--provider', 'fixture', `--out=${out}`])
    assert.notEqual(res.status, 0)
    assert.deepEqual(fs.readdirSync(out), [])
  })

  test('an unknown provider exits non-zero', () => {
    const res = cli(['--pack', PACK, '--provider', '__no_such_provider__'])
    assert.notEqual(res.status, 0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Record contents the contract fixes (decisions 2·3·5·6·8)
// ─────────────────────────────────────────────────────────────────────────────
describe('record assembly', () => {
  test('key order is the schema\'s required[] order, literally', async () => {
    const { record } = await pass()
    assert.deepEqual(Object.keys(record), RUN_SCHEMA.required)
  })

  test('run_id is derived from (pack, provider, run index) — no timestamp, no uuid', async () => {
    const { record } = await pass()
    assert.equal(record.run_id, `${PACK}-fixture-r1`)
    assert.equal(record.pack_slug, PACK)
  })

  test('--run-id= overrides the derived id and names the output file', () => {
    const out = tmpOut('runid')
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--run-id=custom-1', `--out=${out}`])
    assert.equal(res.status, 0, res.stderr)
    assert.deepEqual(fs.readdirSync(out), ['custom-1.json'])
    assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'custom-1.json'), 'utf8')).run_id, 'custom-1')
  })

  test('policy is null by default (decision 5 — no policy bot in this stage)', async () => {
    const { record } = await pass()
    assert.equal(record.policy, null)
  })

  test('--policy=<name> only stamps the field', () => {
    const out = tmpOut('policy')
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--policy=greedy', `--out=${out}`])
    assert.equal(res.status, 0, res.stderr)
    const record = JSON.parse(fs.readFileSync(path.join(out, fs.readdirSync(out)[0]), 'utf8'))
    assert.equal(record.policy, 'greedy')
  })

  test('score is null — the minimal engine has no ending model; do not synthesize one', async () => {
    const { record } = await pass()
    assert.equal(record.score, null)
  })

  test('reached_clock is non-null and equals the last non-null beat clock (decision 6 / D-4)', async () => {
    const { record } = await pass()
    assert.equal(typeof record.reached_clock, 'string')
    assert.match(record.reached_clock, /^([01][0-9]|2[0-3]):[0-5][0-9]\+?$/)
    const clocks = record.beats.map((b) => b.clock).filter((c) => c !== null)
    assert.equal(record.reached_clock, clocks[clocks.length - 1])
  })

  test('injected_blocks is [] on run 1 (decision 8 — blocks are not authored here)', async () => {
    const { record } = await pass()
    assert.deepEqual(record.injected_blocks, [])
  })

  test('fallbacks is an array; the fixture provider never fails, so it is empty', async () => {
    const { record } = await pass()
    assert.deepEqual(record.fallbacks, [])
  })

  test('reduceEvents agrees with the assembled record on beats/fallbacks/reachedClock', async () => {
    const { record, events } = await pass()
    const reduced = reduceEvents(events)
    assert.equal(reduced.reachedClock, record.reached_clock)
    assert.deepEqual(reduced.fallbacks, record.fallbacks)
    assert.deepEqual(
      reduced.beats.map((b) => ({ beat: b.beat, clock: b.clock, gate: b.gate, stance: b.stance })),
      record.beats.map((b) => ({ beat: b.beat, clock: b.clock, gate: b.gate, stance: b.stance })),
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A failed Call 3 is not an empty report — review finding C.
//
// The recorder used to answer a reporter failure with `{facts: [], report_body:
// ''}`, which `run-record.schema.json` rejects (`report_body` has minLength 1),
// and the CLI wrote the file anyway because the write sat outside the
// `--validate` branch. Both halves are asserted here.
// ─────────────────────────────────────────────────────────────────────────────

/** The fixture provider, with Call 3 turned into a hard failure. No second provider. */
function reporterFails(inner = createFixtureProvider()) {
  return {
    mode: inner.mode,
    async send(request) {
      if (request.call_type !== 'reporter') return inner.send(request)
      return {
        ok: false,
        call_type: request.call_type,
        fallback: true,
        code: 'upstream_timeout',
        message: 'seeded failure',
        requestId: null,
        attempts: 2,
      }
    },
  }
}

describe('review finding C — a failed Call 3 never becomes an empty report', () => {
  test('runHeadless refuses to record a run whose reporter call never landed', async () => {
    await assert.rejects(
      () =>
        runHeadless({
          pack: loadPack(PACK),
          guidance: loadGuidance(),
          provider: reporterFails(),
          store: createMemoryMetaStore(),
          runId: `${PACK}-fixture-r1`,
        }),
      /Call 3 never landed/,
    )
  })

  test('the fabricated record the old path produced is one the schema rejects', () => {
    const fabricated = {
      run_id: 'x', pack_slug: PACK, policy: null, reached_clock: '09:25',
      injected_blocks: [], beats: [], timeline: ['a'],
      reports: { facts: [], report_body: '' },
      score: null, fallbacks: [{ beat: 1, call: 3, code: 'upstream_timeout' }],
    }
    const res = validateRunRecord(fabricated)
    assert.ok(
      res.errors.some((e) => /report_body/.test(e)),
      `expected a report_body minLength complaint, got ${JSON.stringify(res.errors)}`,
    )
  })

  test('persistRun writes nothing when the record does not conform', () => {
    const out = tmpOut('invalid')
    const invalid = {
      run_id: 'invalid-1', pack_slug: PACK, policy: null, reached_clock: '09:25',
      injected_blocks: [], beats: [], timeline: ['a'],
      reports: { facts: [], report_body: '' },
      score: null, fallbacks: [],
    }
    assert.throws(() => persistRun({ record: invalid, outDir: out }), /does not conform/)
    assert.deepEqual(fs.readdirSync(out), [], 'an invalid record must never reach the disk')
  })

  test('persistRun validates without being asked — the flag is not the guard', () => {
    const out = tmpOut('nometa')
    const invalid = {
      run_id: 'invalid-2', pack_slug: PACK, policy: null, reached_clock: 'not-a-clock',
      injected_blocks: [], beats: [], timeline: ['a'],
      reports: { facts: ['f'], report_body: 'b' },
      score: null, fallbacks: [],
    }
    assert.throws(() => persistRun({ record: invalid, outDir: out }), /does not conform/)
    assert.deepEqual(fs.readdirSync(out), [])
  })

  test('a conforming record is still written, with and without a meta-state', async () => {
    const { record, meta } = await pass()
    const out = tmpOut('valid')
    const paths = persistRun({ record, meta, outDir: out })
    assert.equal(paths.metaPath !== null, true)
    assert.deepEqual(fs.readdirSync(out).sort(), [
      `${PACK}-fixture-r1.json`,
      `${PACK}-fixture-r1.meta.json`,
    ])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Carry-over reaches the run — review finding A.
//
// e8 built carry-over *across* runs; the record used to name the carried blocks
// while the run's own store stayed empty, so `membrane.deny('unknown_block')`
// fired on the very block the record claimed was injected. These tests fail
// against a `bindRun` that ignores `carried`.
// ─────────────────────────────────────────────────────────────────────────────
const CARRIED = { id: 'b-r1-f01', text: '이전 런에서 채굴한 문장이다.' }

/** A store already holding one ended run and its carry-over — the run-2 case. */
function carriedStore() {
  return createMemoryMetaStore({
    pack_slug: PACK,
    run_count: 1,
    exposure_clock_reached: '21:04+',
    carried_blocks: [{ ...CARRIED }],
    report_archive: [`${PACK}-fixture-r1`],
  })
}

describe('carry-over — the record names only blocks the run actually holds', () => {
  test('bindRun seeds the driver block store, so the composer can resolve the block', () => {
    const rig = bindRun({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: createFixtureProvider(),
      run: 2,
      carried: [{ ...CARRIED }],
    })
    assert.deepEqual(rig.driver.blocks().get(CARRIED.id), { ...CARRIED })
  })

  test('the membrane accepts slot/deploy of a carried block — no unknown_block', () => {
    const rig = bindRun({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: createFixtureProvider(),
      run: 2,
      carried: [{ ...CARRIED }],
    })
    assert.deepEqual(rig.driver.submit({ op: 'slot', block_id: CARRIED.id, slot: 0 }), { ok: true })
    assert.deepEqual(rig.driver.submit({ op: 'deploy', blocks: [CARRIED.id] }), { ok: true })
  })

  test('seeding is exact — an id that was not carried is still unknown', () => {
    const rig = bindRun({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: createFixtureProvider(),
      run: 2,
      carried: [{ ...CARRIED }],
    })
    assert.equal(rig.driver.blocks().get('b-r1-f99'), undefined)
    assert.deepEqual(rig.driver.submit({ op: 'deploy', blocks: ['b-r1-f99'] }), {
      ok: false,
      reason: 'unknown_block',
    })
  })

  test('runHeadless carries the meta-state blocks into the run it records', async () => {
    const { record, blocks } = await runHeadless({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: createFixtureProvider(),
      store: carriedStore(),
      providerName: 'fixture',
    })
    assert.deepEqual(record.injected_blocks.map((b) => b.id), [CARRIED.id])
    assert.deepEqual(
      blocks.get(CARRIED.id),
      { ...CARRIED },
      'the record names a block the run itself must be able to resolve',
    )
  })

  test('run 1 carries nothing — the seeding path invents no block', async () => {
    const { record, blocks } = await pass()
    assert.deepEqual(record.injected_blocks, [])
    assert.equal(blocks.get(CARRIED.id), undefined)
  })

  // ── review finding B — mined_from_run is provenance, not a default ────────
  test('a block minted in a previous run is attributed to that run, not to null', async () => {
    const { record } = await runHeadless({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: createFixtureProvider(),
      store: carriedStore(),
      providerName: 'fixture',
    })
    assert.deepEqual(record.injected_blocks, [
      { id: CARRIED.id, text: CARRIED.text, mined_from_run: `${PACK}-fixture-r1` },
    ])
  })

  test('provenanceOf resolves the archived run id the block id names', () => {
    const archive = [`${PACK}-fixture-r1`, `${PACK}-fixture-r2`]
    assert.equal(provenanceOf({ id: 'b-r2-q07', text: 't' }, archive), `${PACK}-fixture-r2`)
    assert.equal(provenanceOf({ id: 'b-r1-f01', text: 't' }, archive), `${PACK}-fixture-r1`)
  })

  test('null is reserved for the script timeline — an authored t-id, and only that', () => {
    assert.equal(provenanceOf({ id: 't12', text: 't' }, []), null)
  })

  test('an unattributable block throws rather than claiming script provenance', () => {
    assert.throws(
      () => provenanceOf({ id: 'b-r9-f01', text: 't' }, [`${PACK}-fixture-r1`]),
      /not in the report archive/,
    )
    assert.throws(() => provenanceOf({ id: 'not-an-id', text: 't' }, []), /neither the minted/)
  })

  test('a record carrying an unattributable block is never assembled', () => {
    assert.throws(
      () =>
        assembleRecord({
          runId: 'x-r2',
          packSlug: PACK,
          policy: null,
          reduced: { beats: [], timeline: [], fallbacks: [], reachedClock: '09:00' },
          journals: [],
          calls: { stance: 's', facts: ['f'], reportBody: 'b' },
          carried: [{ id: 'b-r1-f01', text: 't' }],
          archive: [],
        }),
      /refusing to invent a run id/,
    )
  })

  test('a carried run is still deterministic — two passes are byte-identical', async () => {
    const one = await runHeadless({
      pack: loadPack(PACK), guidance: loadGuidance(), provider: createFixtureProvider(),
      store: carriedStore(), providerName: 'fixture',
    })
    const two = await runHeadless({
      pack: loadPack(PACK), guidance: loadGuidance(), provider: createFixtureProvider(),
      store: carriedStore(), providerName: 'fixture',
    })
    assert.equal(serialize(one.record), serialize(two.record))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A5 · A6 · A7 · A8 — source guards. Cheap, binary, and the reason a reviewer
// does not have to re-read drive-run every merge.
// ─────────────────────────────────────────────────────────────────────────────
const DRIVER_DIR = path.join(REPO, 'tools/driver')

function driverSources() {
  const out = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(p)
      else if (entry.name.endsWith('.mjs')) out.push(p)
    }
  }
  walk(DRIVER_DIR)
  // drive-beat.mjs is a different unit's file — never assert over it.
  return out.filter((p) => !p.endsWith('drive-beat.mjs')).sort()
}

describe('A5 — no nondeterminism sources', () => {
  const BANNED = /Date\.now|new Date|Math\.random|randomUUID|process\.hrtime|performance\.now/

  test('the guards below are not vacuous — drive-run.mjs is in the scanned set', () => {
    assert.ok(driverSources().some((f) => f.endsWith('drive-run.mjs')), 'tools/driver/drive-run.mjs must exist')
  })

  test('drive-run and its helpers contain no clock, no randomness, no uuid', () => {
    for (const file of driverSources()) {
      const text = fs.readFileSync(file, 'utf8')
      const hit = text.split('\n').findIndex((l) => BANNED.test(l))
      assert.equal(hit, -1, `${path.relative(REPO, file)}:${hit + 1} uses a nondeterministic source`)
    }
  })
})

describe('A6 — zero engine logic, and exactly one fixture provider', () => {
  test('no delta arithmetic, bucket resolution, edge predicates, symptom rendering or id minting', () => {
    const BANNED = [/\bmint[A-Z_]/, /\bbucket\b/i, /edge_predicate/i, /renderSymptoms\s*\(/]
    for (const file of driverSources()) {
      const text = fs.readFileSync(file, 'utf8')
      const code = text.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n')
      for (const re of BANNED) {
        assert.ok(!re.test(code), `${path.relative(REPO, file)} contains engine logic matching ${re}`)
      }
    }
  })

  test('the fixture provider is imported from src/, never re-implemented', () => {
    const joined = driverSources().map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    assert.match(joined, /from\s+['"][^'"]*src\/transport\/fixture\.ts['"]/)
    assert.ok(!/function\s+createFixtureProvider/.test(joined), 'a second fixture provider is a defect')
  })

  test('the schema walker is imported, never duplicated (decision 1 — hard preference)', () => {
    const joined = driverSources().map((f) => fs.readFileSync(f, 'utf8')).join('\n')
    assert.ok(!/const\s+IMPLEMENTED\s*=\s*new Set/.test(joined), 'a second schema walker is a defect')
  })
})

describe('A7 — import discipline', () => {
  test('every relative import of src/ or tests/ carries an explicit .ts extension', () => {
    for (const file of driverSources()) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+['"](\.[^'"]*)['"]/g)) {
        const spec = m[1]
        if (spec.includes('/src/') || spec.includes('/tests/')) {
          assert.match(spec, /\.ts$/, `${path.relative(REPO, file)}: "${spec}" needs an explicit .ts extension`)
        }
      }
    }
  })

  test('no dist/, no path alias, no bundler', () => {
    for (const file of driverSources()) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        assert.ok(!m[1].includes('dist/'), `${path.relative(REPO, file)}: imports from dist/`)
        assert.ok(!m[1].startsWith('@/'), `${path.relative(REPO, file)}: uses a path alias`)
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The tool ships without the test tree — review finding E.
//
// `validate.mjs` used to import its schema walker from `tests/runloop/`, so a
// deployed `src` + `tools` + `data` tree could not run the driver at all. These
// two tests are the cheap guard and the actual proof.
// ─────────────────────────────────────────────────────────────────────────────
describe('layering — a shipped CLI never imports from tests/', () => {
  test('no file under tools/driver imports out of the test tree', () => {
    for (const file of driverSources()) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        assert.ok(
          !/(^|\/)tests\//.test(m[1]),
          `${path.relative(REPO, file)}: imports "${m[1]}" — tests may import from tools, not the reverse`,
        )
      }
    }
  })

  test('src + tools + data alone is a runnable tree', () => {
    const ship = fs.mkdtempSync(path.join(os.tmpdir(), 'e9-ship-'))
    for (const dir of ['src', 'tools', 'data']) {
      fs.cpSync(path.join(REPO, dir), path.join(ship, dir), { recursive: true })
    }
    const out = tmpOut('ship-out')
    const res = cli(['--pack', PACK, '--provider', 'fixture', '--validate', `--out=${out}`], {
      cwd: ship,
      script: path.join(ship, 'tools/driver/drive-run.mjs'),
    })
    assert.equal(res.status, 0, `the shipped tree could not run the driver:\n${res.stderr}`)
    assert.deepEqual(fs.readdirSync(out), [`${PACK}-fixture-r1.json`])
  })
})

describe('A8 — no new dependency', () => {
  test('package.json declares no runtime dependencies and the frozen devDependency set', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'))
    assert.equal(pkg.dependencies, undefined, 'the repo has zero runtime deps — keep it that way')
    assert.deepEqual(Object.keys(pkg.devDependencies).sort(), [
      '@types/node',
      'playwright',
      'typescript',
      'vite',
      'vitest',
    ])
  })

  test('drive-run imports nothing outside node: builtins and this repo', () => {
    for (const file of driverSources()) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1]
        assert.ok(
          spec.startsWith('node:') || spec.startsWith('.') || spec.startsWith('/'),
          `${path.relative(REPO, file)}: bare import "${spec}" is a new dependency`,
        )
      }
    }
  })
})

/**
 * Review finding (r1, round 2) — the recorder disagreed with the live driver
 * about what counts as a judgment.
 *
 * `readJudgment` in `src/driver/live-driver.ts` narrows on `'stance' in body`,
 * so a 200 that lands without one is graded `unusable_payload` and the default
 * stance is submitted. The recorder branched on `result.ok` alone and read
 * `result.body.stance` off that same empty body — `undefined`, which is not a
 * legal `beats[].stance`. A run with seven correctly-graded fallbacks then
 * failed validation seven times and `persistRun` refused it, so the artifact
 * that documents the failure was the one the failure destroyed.
 */
describe('[r1#D] an ok-but-unusable Call 1 is recorded as the default stance', () => {
  /** A 200 whose judgment body carries no `stance` — landed, unusable. */
  function unusableJudgment() {
    const inner = createFixtureProvider()
    return {
      mode: 'fixture',
      async send(request) {
        const result = await inner.send(request)
        if (request.call_type !== 'judgment') return result
        const body = { ...result.body }
        delete body.stance
        return { ...result, body }
      },
    }
  }

  test('no beat records an undefined stance, and the record still validates', async () => {
    const { record, events } = await runHeadless({
      pack: loadPack(PACK),
      guidance: loadGuidance(),
      provider: unusableJudgment(),
      store: createMemoryMetaStore(),
      runId: `${PACK}-unusable-r1`,
    })

    const stances = record.beats.map((beat) => beat.stance)
    assert.equal(
      stances.filter((stance) => stance === undefined).length,
      0,
      'an ok-but-unusable judgment must not leave `undefined` in beats[].stance',
    )

    // Every gate beat falls back to its own default, which is a real stance id.
    for (const beat of record.beats) {
      if (beat.stance === null) continue
      const gate = record.beats.indexOf(beat) >= 0 ? beat.gate : undefined
      if (gate && STANCE_SET.has(gate)) {
        assert.ok(STANCE_SET.get(gate).has(beat.stance), `${gate}: "${beat.stance}" is not one of its stances`)
      }
    }

    assert.deepEqual(validateRunRecord(record).errors, [], 'the record must remain schema-legal')

    // The grading itself must survive: the run still reports the calls as failed.
    const graded = events.filter((event) => JSON.stringify(event).includes('unusable_payload'))
    assert.ok(graded.length > 0, 'the unusable payloads must still be graded as fallbacks')
  })
})
