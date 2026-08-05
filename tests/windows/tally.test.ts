// u7 — TALLY window + run loop: the PURE half.
//
// vitest runs `environment: 'node'` (vitest.config.ts), so this file asserts
// only what is DOM-free: the run-state reducer, the pacing arithmetic, the
// count-up easing, the pack baseline index, the sessionStorage round-trip —
// plus the source-level guards a browser cannot express. The DOM half is
// `e2e/run-loop.spec.ts` (u7 design D1/D3, spec A6).
//
// Covers [u7#c1] run states · [u7#c2] count-up pacing · [u7#c3] new_run is
// driver-fed · [u7#c4] digits are score only · [u7#c6] no storage api ·
// [u7#c8] sole owner of run state · [u7#c9] run-wide hard constraints.
//
// Test titles are load-bearing — the unit's verification commands filter with
// `-t 'new_run is driver-fed'`, `-t 'digits are score only'` and
// `-t 'no storage api'`. Do not rename a describe block without updating
// `.claude/super/units/u7.md`.
//
// C3: nothing here asserts fixture CONTENT. Every stream used below is either
// synthetic (shape only) or read back out of whatever fixture ships in the
// tree, so the suite survives fixture content being replaced wholesale.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { MembraneOp, ViewEvent } from '../../src/shared/view-driver.ts'
import { createFixtureDriver } from '../../src/client/driver/fixture-driver.ts'
import { exists, read, rel, REPO, stripComments } from '../shell/shell-utils.ts'
import type { RunState, Source } from './tally-utils.ts'
import {
  RUN_LOOP_FIXTURE_TS,
  RUN_LOOP_TS,
  RUN_STATE_TS,
  SCORE_TALLY_TS,
  TALLY_TS,
  UNIT_FILES,
  fakeStorage,
  feedEvent,
  metaEvent,
  missingUnitFiles,
  reportEvent,
  runEndEvent,
  runLoop,
  runLoopFixture,
  runState,
  scoreEvent,
  scoreTally,
  syntheticRun,
  throwingStorage,
  trace,
  unitSources,
} from './tally-utils.ts'

/* ── source scanning: never vacuous ──────────────────────────────────────── */

/** Fails loudly (never vacuously) when a source-level scan has nothing to read. */
function scannedSources(): Source[] {
  const sources = unitSources()
  expect(missingUnitFiles(), 'the scan is vacuous — u7 has not written these files yet').toEqual([])
  expect(sources.every((s) => s.text.trim().length > 0)).toBe(true)
  return sources
}

function offenders(re: RegExp): string[] {
  return scannedSources()
    .filter((s) => re.test(s.text))
    .map((s) => s.file)
}

function sourceOf(file: string): string {
  const source = scannedSources().find((s) => s.file === rel(file))
  expect(source, `${rel(file)} is not on disk`).toBeTruthy()
  return source!.text
}

/** Every string/template literal in `text` (regex-level, good enough for a lint). */
function literals(text: string): string[] {
  return [...text.matchAll(/'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\$]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '')
}

/* ══ [u7#c1] run states ═════════════════════════════════════════════════ */

describe('[u7#c1] run states are a projection of the stream', () => {
  it('(a) the pure surface is exported and DOM-free — importing it under node works', async () => {
    const m = await runState()
    for (const fn of ['initialRunState', 'reduce', 'createRunState', 'getRunState']) {
      expect(typeof (m as unknown as Record<string, unknown>)[fn], `run-state.ts must export ${fn}()`).toBe('function')
    }
    expect(typeof m.META_KEY).toBe('string')
  })

  it('(b) the desk opens on BUILD with no score in hand', async () => {
    const m = await runState()
    const start = m.initialRunState()
    expect(start.phase).toBe('build')
    expect(start.score).toBeNull()
    expect(start.meta.carried).toEqual([])
    expect(start.meta.archive).toEqual([])
  })

  it('(c) the sequence is build → run → report → tally → build, driven only by events', async () => {
    const m = await runState()
    const stream: ViewEvent[] = [
      metaEvent({ run: 3, runsLeft: 7 }),
      feedEvent('08:50'),
      reportEvent(3),
      scoreEvent(7),
      runEndEvent(3),
      metaEvent({ run: 4, runsLeft: 6 }),
    ]
    expect(trace(m, stream).map((s) => s.phase)).toEqual(['build', 'run', 'report', 'tally', 'tally', 'build'])
  })

  it('(d) `reduce` is pure — the input state and the event are left untouched', async () => {
    const m = await runState()
    const before = m.initialRunState()
    const snapshot = JSON.parse(JSON.stringify(before)) as RunState
    const event = metaEvent({ run: 3, runsLeft: 7, carried: ['b-x'], archive: [{ run: 2, label: 'RUN 02' }] })
    const eventSnapshot = JSON.parse(JSON.stringify(event)) as ViewEvent

    const after = m.reduce(before, event)
    expect(before).toEqual(snapshot)
    expect(event).toEqual(eventSnapshot)
    expect(after).not.toBe(before)
  })

  it('(e) an event the phase does not care about leaves the phase alone', async () => {
    const m = await runState()
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 3, runsLeft: 7 }))
    state = m.reduce(state, feedEvent('08:50'))
    const at = state.phase
    state = m.reduce(state, { type: 'waiting', active: true, for: 'report' })
    expect(state.phase).toBe(at)
    state = m.reduce(state, { type: 'fallback', call: 1, code: 'x', beat: 1 })
    expect(state.phase).toBe(at)
  })

  it('(f) the last run leaves −00 and nothing decrements it further', async () => {
    const m = await runState()
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 10, runsLeft: 0 }))
    expect(state.meta.runsLeft).toBe(0)
    for (const event of [feedEvent('09:00'), reportEvent(10), scoreEvent(1), runEndEvent(10)]) {
      state = m.reduce(state, event)
      expect(state.meta.runsLeft, 'runsLeft moved without a `meta` event').toBe(0)
      expect(state.meta.run).toBe(10)
    }
  })

  it('(g) the run-loop facade replays a second run through listeners bound before the swap', async () => {
    const loop = await runLoop()
    const fixture = await runLoopFixture()
    expect(fixture.woodariRunLoop.length, 'the loop fixture carries fewer than two runs').toBeGreaterThan(1)

    const driver = loop.createRunLoopDriver(fixture.woodariRunLoop)
    const seen: ViewEvent[] = []
    driver.subscribe((e) => void seen.push(e))
    driver.start()
    driver.advance(0)
    driver.drain()

    const first = seen.filter((e) => e.type === 'meta').pop()
    expect(first, 'the first run released no `meta` event').toBeTruthy()

    driver.send({ op: 'new_run' })
    const next = seen.filter((e) => e.type === 'meta').pop()
    expect(next, 'no `meta` arrived after new_run — the loop did not rebuild').toBeTruthy()
    expect((next as { run: number }).run).not.toBe((first as { run: number }).run)
  })

  it('(h) the loop fixture grows carried[] and archive[] run over run — the client never does', async () => {
    const fixture = await runLoopFixture()
    const metas = fixture.woodariRunLoop.map(
      (run) => run.events.filter((e) => e.type === 'meta').pop() as Extract<ViewEvent, { type: 'meta' }> | undefined,
    )
    expect(metas.every(Boolean), 'a run in the loop fixture carries no `meta` event').toBe(true)

    for (let i = 1; i < metas.length; i += 1) {
      const prev = metas[i - 1]!
      const now = metas[i]!
      expect(now.run).toBe(prev.run + 1)
      expect(now.runs_left).toBe(prev.runs_left - 1)
      expect(now.archive.length).toBeGreaterThan(prev.archive.length)
      expect(now.carried.length).toBeGreaterThanOrEqual(prev.carried.length)
    }
  })
})

/* ══ [u7#c3] new_run is driver-fed ══════════════════════════════════════ */

describe('[u7#c3] new_run is driver-fed', () => {
  it('(a) run / runsLeft / carried / archive are copied off the `meta` event verbatim', async () => {
    const m = await runState()
    const event = {
      type: 'meta' as const,
      run: 4,
      runs_left: 6,
      carried: ['b-r2-f03', 'b-r1-b02'],
      archive: [
        { run: 1, label: 'RUN 01 / 08:50 — 21:04' },
        { run: 2, label: 'RUN 02 / 08:50 — 21:04' },
      ],
    }
    const state = m.reduce(m.initialRunState(), event)
    expect(state.meta.run).toBe(event.run)
    expect(state.meta.runsLeft).toBe(event.runs_left)
    expect(state.meta.carried).toEqual(event.carried)
    expect(state.meta.archive).toEqual(event.archive)
  })

  it('(b) a second `meta` replaces the numbers wholesale — no accumulation', async () => {
    const m = await runState()
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 3, runsLeft: 7, carried: ['a', 'b'] }))
    state = m.reduce(state, metaEvent({ run: 9, runsLeft: 1, carried: ['c'] }))
    expect(state.meta.run).toBe(9)
    expect(state.meta.runsLeft).toBe(1)
    expect(state.meta.carried).toEqual(['c'])
  })

  it('(c) the client never mirrors the numbers — a `meta` that goes backwards is obeyed', async () => {
    const m = await runState()
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 5, runsLeft: 5 }))
    state = m.reduce(state, runEndEvent(5))
    state = m.reduce(state, metaEvent({ run: 2, runsLeft: 8 }))
    expect(state.meta.run).toBe(2)
    expect(state.meta.runsLeft).toBe(8)
  })

  it('(d) `new_run` is an OP, not an event — it moves no phase by itself', async () => {
    const m = await runState()
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 3, runsLeft: 7 }))
    state = m.reduce(state, runEndEvent(3))
    expect(state.phase).toBe('tally')
    // The window sends the op; the desk stays in TALLY until the driver answers
    // with the next run's `meta`.
    expect(m.reduce(state, scoreEvent(7)).phase).toBe('tally')
    expect(m.reduce(state, metaEvent({ run: 4, runsLeft: 6 })).phase).toBe('build')
  })

  it('(e) the op the window sends is exactly `{op:"new_run"}` and the driver answers it', () => {
    const driver = createFixtureDriver(syntheticRun([metaEvent({ run: 3, runsLeft: 7 })]))
    driver.start()
    const op: MembraneOp = { op: 'new_run' }
    expect(Object.keys(op)).toEqual(['op'])
    expect(driver.send(op)).toEqual({ ok: true })
  })

  it('(f) source: the three owned modules do no arithmetic on the meta fields', () => {
    const fields = ['run', 'runsLeft', 'runs_left', 'carried', 'archive']
    for (const source of scannedSources()) {
      for (const field of fields) {
        const re = new RegExp(
          `\\b${field}\\b\\s*(?:\\+\\+|--|\\+=|-=)|(?:\\+\\+|--)\\s*\\b${field}\\b|\\b${field}\\b\\s*[+\\-]\\s*\\d`,
          '',
        )
        expect(re.test(source.text), `${source.file} does arithmetic on ${field}`).toBe(false)
      }
      expect(/Math\.max\s*\(/.test(source.text), `${source.file} clamps a driver-fed number`).toBe(false)
    }
  })

  it('(g) source: NEW RUN disables its button BEFORE it sends, so one activation is one op', () => {
    const text = sourceOf(TALLY_TS)
    expect(text, 'tally.ts never sends the new_run op').toMatch(/['"]new_run['"]/)

    const sends = [...text.matchAll(/send\s*\(\s*\{\s*op\s*:\s*['"]new_run['"]/g)]
    expect(sends.length, 'the new_run op is sent from more than one place').toBe(1)

    const guard = text.search(/disabled\s*=\s*true/)
    expect(guard, 'tally.ts never disables #btnNewRun').toBeGreaterThan(-1)
    expect(guard, 'the button is disabled AFTER the op is sent — a double click sends twice').toBeLessThan(
      sends[0]!.index!,
    )
  })

  it('(h) [u7#c8] run-state exports no mutator — every transition is an event', async () => {
    const m = await runState()
    const surface = Object.keys(m as unknown as Record<string, unknown>)
    for (const name of surface) {
      expect(name, 'run-state.ts exports a phase mutator').not.toMatch(/^(?:set|dispatch|advance|goto|force)/i)
    }
    const text = sourceOf(RUN_STATE_TS)
    expect(/export\s+(?:function|const)\s+set[A-Z]/.test(text)).toBe(false)
  })

  it('(i) [u7#c8] no other window or component writes run state', () => {
    for (const source of scannedSources()) {
      if (source.file === rel(RUN_STATE_TS)) continue
      expect(/\.phase\s*=(?!=)/.test(source.text), `${source.file} assigns a run phase`).toBe(false)
      expect(/\.meta\s*=(?!=)/.test(source.text), `${source.file} assigns meta state`).toBe(false)
    }
  })
})

/* ══ [u7#c4] digits are score only ══════════════════════════════════════ */

describe('[u7#c4] digits are score only', () => {
  it('(a) the score reducer copies total and rows verbatim — no client arithmetic', async () => {
    const m = await runState()
    const rows = [
      { label: 'a', value: 200, baseline: 200 },
      { label: 'b', value: 7, baseline: 7 },
    ]
    const state = m.reduce(m.initialRunState(), scoreEvent(7, rows, 26))
    // `baselineTotal` rides across with the rest (§5.2 amendment h) — copied,
    // never derived. The claim is still "no client arithmetic": the reducer may
    // not compute 26 from the rows, and here it could not, because the rows sum
    // to 207.
    expect(state.score).toEqual({ total: 7, baselineTotal: 26, rows })
  })

  it('(b) the headline lands exactly on the event total — the count-up invents no number', async () => {
    const t = await scoreTally()
    for (const total of [0, 1, 7, 24, 812]) {
      expect(t.countUpAt(total, 0)).toBe(0)
      expect(t.countUpAt(total, 1)).toBe(total)
      for (const k of [0.1, 0.25, 0.5, 0.75, 0.9]) {
        const at = t.countUpAt(total, k)
        expect(at).toBeGreaterThanOrEqual(0)
        expect(at).toBeLessThanOrEqual(total)
        expect(Number.isInteger(at), 'the ledger paints a fractional death count').toBe(true)
      }
    }
  })

  // RE-AIMED (08-05, R1 on tally.ts:218), never weakened: this case used to
  // assert that `baselineIndex()` resolved `label → baseline` out of the pack's
  // `score.json`. That read was the defect — `architecture-map.md` §2.1 gives
  // the view `meta.json` and nothing else, and inv 12 says a window consumes
  // `ViewEvent`s only. The helper is gone with the fetch, so the case now pins
  // the RULE that replaced it: no client surface opens `score.json` at all.
  it('(c) no client surface reads `score.json` — the baseline waits on the seam (inv 12)', () => {
    // Scanned across the whole client, not just u7: the file is the engine's,
    // whichever window would like its numbers.
    const files: string[] = []
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.ts')) files.push(full)
      }
    }
    walk(path.join(REPO, 'src/client'))
    expect(files.length, 'the scan is vacuous — no client source was read').toBeGreaterThan(0)
    const offenders = files
      .filter((file) => /score\.json/.test(stripComments(read(file))))
      .map((file) => rel(file))
    expect(offenders, 'a client surface opens the engine-owned score.json').toEqual([])
  })

  it('(d) u7 paints digits only into selectors the inv-2 scan excludes by name', () => {
    const invariant = read(path.join(REPO, 'tests/invariants/no-digit-npc.test.ts'))
    expect(invariant.length, 'the inv-2 suite is missing — the cross-check is vacuous').toBeGreaterThan(0)
    for (const selector of ['.ledger', '.tly-table', '.th-v', '.tr-v']) {
      expect(invariant, `${selector} is not on the inv-2 excluded list`).toContain(selector)
    }
    const painted = scannedSources().map((s) => s.text).join('\n')
    for (const cls of ['tly-table', 'th-v', 'tr-v']) {
      expect(painted, `u7 never paints ${cls} — the ledger scope is vacuous`).toContain(cls)
    }
  })

  it('(e) u7 never writes to an NPC channel — the feed is not its surface (inv 2)', () => {
    expect(offenders(/['"](?:npc|symptom)['"]/)).toEqual([])
    expect(offenders(/\bkind\s*:\s*['"]/)).toEqual([])
    expect(offenders(/windows\/live-feed/)).toEqual([])
  })

  it('(f) every digit-bearing prose literal is a ledger caption, never an NPC line', () => {
    const LEDGER_DIGIT_LITERALS = /집계표|시점 집계|RUN|기준/
    for (const source of scannedSources()) {
      for (const literal of literals(source.text)) {
        if (!/[가-힣]/.test(literal)) continue
        if (!/[0-9]/.test(literal)) continue
        expect(
          LEDGER_DIGIT_LITERALS.test(literal),
          `${source.file}: digit-bearing prose outside the ledger — ${literal}`,
        ).toBe(true)
      }
    }
  })
})

/* ══ [u7#c2] count-up pacing ════════════════════════════════════════════ */

describe('[u7#c2] count-up pacing is ~9 s and absorbs the report call', () => {
  it('(a) the reference cadence constants are ported, not re-invented', async () => {
    const t = await scoreTally()
    expect(t.PACE.OPEN_DELAY).toBe(900)
    expect(t.PACE.LEAD).toBe(500)
    expect(t.PACE.ROW_STEP).toBe(640)
    expect(t.PACE.VERDICT_AFTER).toBe(300)
    expect(t.PACE.COUNT_MS).toBe(3400)
    expect(t.PACE.TOTAL_MS).toBe(9000)
  })

  it('(b) SETTLE is derived from the 9 s target, clamped — never the reference literal', async () => {
    const t = await scoreTally()
    const clamp = (v: number): number => Math.min(6000, Math.max(1400, v))
    for (let rows = 0; rows <= 12; rows += 1) {
      expect(t.settleMs(rows), `settleMs(${rows})`).toBe(clamp(9000 - 900 - 500 - rows * 640))
    }
  })

  it('(c) run_end → final lands on 9 s for every ledger the seam can carry', async () => {
    const t = await scoreTally()
    const total = (rows: number): number => t.PACE.OPEN_DELAY + t.PACE.LEAD + rows * t.PACE.ROW_STEP + t.settleMs(rows)
    for (let rows = 3; rows <= 9; rows += 1) expect(total(rows), `${rows} rows`).toBe(t.PACE.TOTAL_MS)
    for (let rows = 1; rows <= 12; rows += 1) {
      expect(total(rows), `${rows} rows is outside c2's band`).toBeGreaterThanOrEqual(7500)
      expect(total(rows), `${rows} rows is outside c2's band`).toBeLessThanOrEqual(10500)
    }
  })

  it('(d) an empty ledger still settles — the floor holds and nothing races to final', async () => {
    const t = await scoreTally()
    expect(t.settleMs(0)).toBeGreaterThanOrEqual(1400)
    expect(t.PACE.OPEN_DELAY + t.PACE.LEAD + t.settleMs(0)).toBeGreaterThan(t.PACE.COUNT_MS)
  })

  it('(e) the count-up eases out — it is ahead of linear at every midpoint, and monotone', async () => {
    const t = await scoreTally()
    const to = 1000
    expect(t.countUpAt(to, 0.5)).toBeGreaterThan(to * 0.5)
    let previous = -1
    for (let k = 0; k <= 1.0001; k += 0.05) {
      const at = t.countUpAt(to, Math.min(1, k))
      expect(at).toBeGreaterThanOrEqual(previous)
      previous = at
    }
  })

  it('(f) a lagging frame cannot overshoot — k is clamped both ends', async () => {
    const t = await scoreTally()
    expect(t.countUpAt(24, -1)).toBe(0)
    expect(t.countUpAt(24, 4)).toBe(24)
  })

  it('(g) FINAL is unreachable before the `score` event — the reducer holds the gate', async () => {
    const m = await runState()
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 3, runsLeft: 7 }))
    state = m.reduce(state, reportEvent(3))
    state = m.reduce(state, runEndEvent(3))
    expect(state.phase).toBe('tally')
    expect(state.score, 'TALLY opened with a score already in hand — nothing was absorbed').toBeNull()

    state = m.reduce(state, scoreEvent(7, [{ label: 'a', value: 1, baseline: 1 }]))
    expect(state.score).not.toBeNull()
  })

  it('(h) source: the cadence is injectable — it never rides the driver pump', () => {
    const text = sourceOf(SCORE_TALLY_TS)
    expect(text, 'score-tally.ts takes no Scheduler — the cadence cannot be virtualised').toMatch(/scheduler/i)
    expect(/registerAnimation|tickAnimations/.test(text), 'the tally rides the driver pump — the clock has ended').toBe(
      false,
    )
  })

  it('(i) source: no spinner — the wait is diegetic (design D2)', () => {
    expect(offenders(/spinner|loading|is-busy|throbber/i)).toEqual([])
    expect(sourceOf(TALLY_TS)).toContain('……보고서 정리 중')
  })

  // R4 on score-tally.ts:258 (round 1): the count-up may not ANNOUNCE a
  // delivery it never checked. (Round 2): and the hold it replaced the wall
  // clock with may not be endless.
  it('(j) the hold has a ceiling, and the ceiling is past every count-up the seam can produce', async () => {
    const t = await scoreTally()
    expect(t.PACE.HOLD_CEIL, 'the 30 s worst case the engine`s one retry puts the generation at').toBe(30_000)
    const total = (rows: number): number => t.PACE.OPEN_DELAY + t.PACE.LEAD + rows * t.PACE.ROW_STEP + t.settleMs(rows)
    for (let rows = 0; rows <= 12; rows += 1) {
      expect(t.PACE.HOLD_CEIL, `${rows} rows out-counts the ceiling`).toBeGreaterThan(total(rows))
    }
  })

  it('(k) between floor and ceiling the wait belongs to the report — neither half releases alone', async () => {
    const t = await scoreTally()
    const release = (counted: boolean, filed: boolean, lapsed: boolean): string =>
      t.settleRelease({ counted, filed, lapsed })

    expect(release(false, false, false), 'nothing has happened yet').toBe('hold')
    expect(release(true, false, false), 'the count-up alone released — a wall clock, not an absorber').toBe('hold')
    expect(release(false, true, false), 'the report cut the count-up short — the floor is gone').toBe('hold')
    expect(release(true, true, false), 'the ledger counted AND the report landed').toBe('filed')
  })

  it('(l) past the ceiling the day is handed back — degraded, and claiming nothing', async () => {
    const t = await scoreTally()
    const release = (counted: boolean, filed: boolean, lapsed: boolean): string =>
      t.settleRelease({ counted, filed, lapsed })

    expect(release(true, false, true), 'the hold ran past the ceiling and never released').toBe('lapsed')
    expect(release(false, false, true), 'a ledger that never counted is still owed its day back').toBe('lapsed')
    expect(release(true, true, true), 'a report in hand at the ceiling is still an arrival').toBe('filed')

    // …and 'lapsed' says something else: the arrival copy is the arrival's, so
    // a release that saw no report may not borrow it.
    const text = sourceOf(TALLY_TS)
    const filedLine = /const FILED_TAIL = '([^']*)'/.exec(text)?.[1] ?? ''
    const lapsedLine = /const LAPSED_TAIL = '([^']*)'/.exec(text)?.[1] ?? ''
    expect(filedLine, 'the arrival line is gone').toContain('도착')
    expect(lapsedLine, 'the degraded release has no line of its own').toBeTruthy()
    expect(lapsedLine, 'the degraded release claims an arrival it never saw').not.toBe(filedLine)
    expect(lapsedLine).not.toMatch(/도착했습니다/)
    // It is a beat, not an error report (inv 5 — no dead UI, ever).
    for (const dead of [/timed?\s*out/i, /timeout/i, /응답\s*없음/, /다시\s*시도/, /요청\s*실패/, /연결\s*끊/]) {
      expect(lapsedLine, `the degraded line reads as dead UI: ${dead}`).not.toMatch(dead)
    }
  })

  it('(m) the release predicate is contract-backed: a report is the run`s because it is ITS report', async () => {
    const m = await runState()
    // §5.2 types `report` with a ROUND (`spec-client.md:179`) and `meta` with a
    // RUN. A day whose last round is not numbered like its run is a legal seam
    // value — the demo fixture`s `round = run` is a fixture property.
    let state = m.reduce(m.initialRunState(), metaEvent({ run: 3, runsLeft: 7 }))
    expect(m.hasFiledReport(state), 'a fresh run opened with a report already in hand').toBe(false)

    state = m.reduce(state, reportEvent(2))
    state = m.reduce(state, runEndEvent(3))
    state = m.reduce(state, scoreEvent(7, [{ label: 'a', value: 1, baseline: 1 }]))
    expect(state.phase).toBe('tally')
    expect(state.report, 'the round the seam filed was rewritten to the run number').toBe(2)
    expect(m.hasFiledReport(state), 'RUN 03 filed round 2 and the desk did not count it — the hold hangs').toBe(true)

    // The next run starts owing its own report; the previous day`s cannot pay.
    state = m.reduce(state, metaEvent({ run: 4, runsLeft: 6 }))
    expect(m.hasFiledReport(state), 'the new run inherited the last run`s report').toBe(false)
  })

  it('(n) source: no window keys the wait on `round === run`', () => {
    for (const source of scannedSources()) {
      expect(
        source.text,
        `${source.file} compares a report ROUND against meta.run — a guarantee §5.2 does not make`,
      ).not.toMatch(/report\s*===\s*[A-Za-z.]*meta\.run|meta\.run\s*===\s*[A-Za-z.]*\.report/)
    }
  })
})

/* ══ [u7#c6] no storage api ═════════════════════════════════════════════ */

describe('[u7#c6] no storage api beyond sessionStorage', () => {
  it('(a) C4 — localStorage appears in no u7-owned file', () => {
    expect(offenders(/\blocalStorage\b/)).toEqual([])
  })

  it('(b) sessionStorage is named only by run-state.ts', () => {
    expect(offenders(/\bsessionStorage\b/)).toEqual([rel(RUN_STATE_TS)])
  })

  it('(c) no other persistence API is reached for', () => {
    expect(offenders(/indexedDB|document\.cookie|caches\b|navigator\.storage/)).toEqual([])
  })

  it('(d) the key is the agreed one and the value is the `meta` event verbatim', async () => {
    const m = await runState()
    expect(m.META_KEY).toBe('ndsp:meta:v1')

    const storage = fakeStorage()
    const event = metaEvent({ run: 4, runsLeft: 6, carried: ['b-x'], archive: [{ run: 3, label: 'RUN 03' }] })
    const driver = createFixtureDriver(syntheticRun([event]))
    createRunStateAnd(m, driver, storage)

    const written = storage.getItem(m.META_KEY)
    expect(written, 'nothing was persisted for the next reload').toBeTruthy()
    expect(JSON.parse(written!)).toEqual(event)
  })

  it('(e) a reload restores run / carried / archive from the persisted `meta`', async () => {
    const m = await runState()
    const event = metaEvent({ run: 4, runsLeft: 6, carried: ['b-x', 'b-y'], archive: [{ run: 3, label: 'RUN 03' }] })
    const storage = fakeStorage({ [m.META_KEY]: JSON.stringify(event) })

    // A fresh boot with an EMPTY stream: everything on screen came off storage.
    const cold = createFixtureDriver(syntheticRun([]))
    const store = m.createRunState(cold, { storage })
    cold.start()

    const restored = store.get()
    expect(restored.meta.run).toBe(4)
    expect(restored.meta.runsLeft).toBe(6)
    expect(restored.meta.carried).toEqual(['b-x', 'b-y'])
    expect(restored.meta.archive).toEqual([{ run: 3, label: 'RUN 03' }])
    expect(restored.score, 'the score survived the reload — only `meta` persists').toBeNull()
  })

  it('(f) private mode degrades to memory — a throwing Storage never crashes the boot', async () => {
    const m = await runState()
    const driver = createFixtureDriver(syntheticRun([metaEvent({ run: 3, runsLeft: 7 })]))
    expect(() => {
      const store = m.createRunState(driver, { storage: throwingStorage() })
      driver.start()
      driver.advance(0)
      driver.drain()
      expect(store.get().meta.run).toBe(3)
    }).not.toThrow()
  })

  it('(g) corrupt storage is ignored, not obeyed', async () => {
    const m = await runState()
    const storage = fakeStorage({ [m.META_KEY]: '{not json' })
    const driver = createFixtureDriver(syntheticRun([]))
    expect(() => m.createRunState(driver, { storage })).not.toThrow()
    expect(m.createRunState(driver, { storage }).get().meta.carried).toEqual([])
  })

  it('(h) subscribers see every transition and unsubscribe cleanly', async () => {
    const m = await runState()
    const driver = createFixtureDriver(syntheticRun([metaEvent({ run: 3, runsLeft: 7 }), runEndEvent(3)]))
    const store = m.createRunState(driver, { storage: fakeStorage() })

    const phases: string[] = []
    const off = store.subscribe((s) => void phases.push(s.phase))
    driver.start()
    driver.advance(0)
    driver.drain()
    expect(phases.length).toBeGreaterThan(0)
    expect(phases[phases.length - 1]).toBe('tally')

    off()
    const seen = phases.length
    driver.drain()
    expect(phases.length).toBe(seen)
  })
})

/** Boots a run-state over a driver and drains it — the persisted-write path. */
function createRunStateAnd(
  m: Awaited<ReturnType<typeof runState>>,
  driver: ReturnType<typeof createFixtureDriver>,
  storage: Storage,
): void {
  m.createRunState(driver, { storage })
  driver.start()
  driver.advance(0)
  driver.drain()
}

/* ══ [u7#c9] run-wide hard constraints ══════════════════════════════════ */

describe('[u7#c9] run-wide hard constraints hold in this unit', () => {
  it('(a) the unit wrote exactly the modules its contract names', () => {
    expect(missingUnitFiles()).toEqual([])
    for (const file of [RUN_LOOP_TS, RUN_LOOP_FIXTURE_TS]) {
      expect(exists(file), `${rel(file)} (u7 design D2) is missing`).toBe(true)
    }
  })

  it('(b) C8 — the seam is reached through driver/index.ts, never engine or composer', () => {
    for (const source of scannedSources()) {
      for (const m of source.text.matchAll(/from\s*['"]([^'"]+)['"]/g)) {
        expect(m[1], `${source.file} imports ${m[1]}`).not.toMatch(/engine|composer/)
      }
    }
  })

  it('(c) C10 — no free-text surface anywhere in the unit', () => {
    expect(offenders(/createElement\s*\(\s*['"`](?:input|textarea|select)['"`]/i)).toEqual([])
    expect(offenders(/contenteditable/i)).toEqual([])
    expect(offenders(/<\s*(?:input|textarea|select)\b/i)).toEqual([])
  })

  it('(d) C11 — no color/size/font literal in TS; u7 writes no CSS at all', () => {
    expect(offenders(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/)).toEqual([])
    expect(offenders(/\b(?:rgb|rgba|hsl|hsla)\s*\(/)).toEqual([])
    expect(offenders(/['"`][^'"`]*\b\d+(?:\.\d+)?(?:px|rem|em|vw|vh)\b/)).toEqual([])
    expect(offenders(/\.style\.[A-Za-z]/)).toEqual([])
    expect(offenders(/['"]\.\.?\/[^'"]*\.css['"]/)).toEqual([])

    const sheet = read(path.join(REPO, 'src/client/styles/win-tally.css'))
    expect(sheet.length, 'u1 already shipped the tally skin — u7 must not need one').toBeGreaterThan(0)
    for (const cls of ['.tly-head', '.tly-table', '.tr-b', '.th-b', '.btn-newrun', '.tly-wait']) {
      expect(sheet, `${cls} is missing from the shipped skin`).toContain(cls)
    }
  })

  it('(e) C13 — the shared modules are consumed, never touched', () => {
    expect(offenders(/\bsegmentReportBody\b/)).toEqual([])
    expect(offenders(/shared\/(?:segment|species)(\.ts)?['"]/)).toEqual([])
  })

  it('(f) the window imports no sibling window', () => {
    for (const source of scannedSources()) {
      for (const m of source.text.matchAll(/from\s*['"]([^'"]+)['"]/g)) {
        expect(m[1], `${source.file} imports a sibling window`).not.toMatch(
          /windows\/(?:live-feed|agent-file|block-store|reports)/,
        )
      }
    }
  })

  // C17 / [u11#c12] — RE-AIMED (08-04), never deleted. The C5 SPLIT added a third host: the
  // §7 fixture round and the P0-B captures are DEV-only by inv 11, so C5(a)
  // ruled they may run on `npm run dev`. A blanket `not.toMatch(/npm run dev/)`
  // now contradicts a ruling. The u7 intent — "the runner this unit's specs run
  // on serves a real build" — is asserted directly instead: the host u7's specs
  // use (the `chromium` project, port 5174) is a build+preview, and the dev host
  // is fenced to the two spec files that cannot exist anywhere else.
  it('(g) C5 — the e2e runner serves a real build', () => {
    const config = stripComments(read(path.join(REPO, 'playwright.config.ts')))
    expect(config).toMatch(/npm run preview/)
    expect(config).toMatch(/npm run build/)

    const unitHost = config.match(/command:\s*`([^`]*--port \$\{UNIT_PORT\}[^`]*)`/)?.[1] ?? ''
    expect(unitHost, "u7's specs run on the 5174 host").toBeTruthy()
    expect(unitHost).toMatch(/npm run build/)
    expect(unitHost).toMatch(/npm run preview/)
    expect(unitHost, 'the host u7 was merged against is never the dev server').not.toMatch(/npm run dev/)

    const devHosts = [...config.matchAll(/command:\s*`([^`]*npm run dev[^`]*)`/g)]
    expect(devHosts.length, 'at most the one dev host C5(a) ruled for the fixture round').toBeLessThanOrEqual(1)
    if (devHosts.length === 1) {
      expect(config, 'the dev host is fenced to the acceptance/captures specs').toMatch(
        /DEV_HOSTED\s*=\s*\/\(acceptance\|captures\)/,
      )
    }
  })

  it('(h) no module-scope DOM — the unit imports cleanly under node', async () => {
    await expect(runState()).resolves.toBeTruthy()
    await expect(scoreTally()).resolves.toBeTruthy()
  })

  it('(i) the unit owns no shared barrel edit — only the five files it declared', () => {
    const registry = read(path.join(REPO, 'src/client/shell/window-registry.ts'))
    expect(registry).toContain('windows/tally.ts')
    expect(registry, 'u7 wired its component through the registry').not.toContain('score-tally')
  })
})

/* Keep `UNIT_FILES` load-bearing: the scan list IS the ownership list (c8). */
describe('[u7] ownership', () => {
  it('scans exactly the three modules the design assigns to u7', () => {
    expect(UNIT_FILES.map(rel)).toEqual([
      'src/client/shell/run-state.ts',
      'src/client/components/score-tally.ts',
      'src/client/windows/tally.ts',
    ])
  })
})
