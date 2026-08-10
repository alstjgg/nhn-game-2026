// [e3 · F4] `exposure.extra_condition` is read on EVERY surface a beat reaches.
//
// The slot decides whether an authored row happened on this run. It was read in
// exactly one place — `engine/index.ts`'s `scriptLinesOf`, which builds the
// feed — while the beat driver's `fixedAction` and `presentNpcs` walked
// `beat.events` whole. So the paper printed the branch the run took and the
// PROMPT was handed every branch the pack authored, under a heading that
// introduces the slot as `[이미 일어난 일 — 이대로 일어났다 … 모순되지도 마라]`.
// On 멈춘회전문 that is two mutually exclusive endings in one request.
//
// Nothing caught it, and the reason is worth keeping: `availability` — the
// sibling F4 slot, same rule, same un-hardened-prose exemption — has had a test
// block since it landed (`beat/schedule.test.ts`), and `extra_condition` had
// none at all. Every assert in the repo read the feed.
//
// SCOPE: engine-scoped. (a) proves the RULE on hand-built packs, because a rule
// stated on a fixture is a rule and not a coincidence of today's pack; (b)
// walks the pack the deploy actually ships and holds the two surfaces against
// each other, because that is the shape the defect took and a fixture cannot
// notice a pack that grows a new conditional row tomorrow.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSchedule } from '../../src/engine/beat/schedule.ts'
import { createEngine } from '../../src/engine/index.ts'
import type { EnginePack } from '../../src/engine/index.ts'
import type { Beat } from '../../src/engine/beat/schedule.ts'
import type { Characters, Gates, Symptoms, Temperament, Timeline } from '../../src/shared/datapack.ts'
import { PACK_SLUG } from '../../src/client/shell/pack.ts'
import { rig } from './beat/harness.ts'
import { exposurePack, twinRosterPack } from './beat/fixtures/packs.ts'

/* ══ (a) the rule ═══════════════════════════════════════════════════════════ */

/** Drives the whole fixture, answering the one gate with `stance`. */
function drive(r: ReturnType<typeof rig>, stance: string): { fixed: string[]; roster: string[][] } {
  const fixed: string[] = []
  const roster: string[][] = []
  for (;;) {
    const cur = r.driver.current()
    if (cur.kind === 'gate') r.driver.submitStance({ stance, utterance: 'u' })
    r.driver.applyBeatEffects()
    const view = r.driver.beatView()
    fixed.push(view.FIXED_NPC_ACTION)
    roster.push(view.PRESENT_NPCS.map((npc) => npc.id))
    if (!r.driver.advance()) break
  }
  return { fixed, roster }
}

describe('[e3#F4] a ROW reaches the prompt only where its exposure holds', () => {
  it('(a) the branch that happened is handed to the model, and only it', () => {
    // `b` sets `opened`, so the 10:00 beat's exclusive pair resolves to the
    // opened half. The shut half is not merely unprinted — it must not be in
    // FIXED_NPC_ACTION either, which is the whole defect.
    const opened = drive(rig(exposurePack()), 'b')
    expect(opened.fixed[1]).toBe('opened-row')
    expect(opened.roster[1]).toEqual(['c1'])

    // …and the other way round, so this cannot pass by filtering everything.
    const shut = drive(rig(exposurePack()), 'a')
    expect(shut.fixed[1]).toBe('shut-row')
    expect(shut.roster[1]).toEqual(['c2'])
  })

  it('(b) un-hardened PROSE shows the row — F4 is opt-in, and packs still carry it', () => {
    // 우는다리's t5 says 현장(관리동)을 들여다본 런에만 보임. Reading that through
    // `holds()` alone answers false and silently deletes an authored row from
    // every run of a pack nobody changed; `datapack:lint` FLAGs it as hardening
    // work instead, and the engine shows the line. Same rule as `availability`.
    const r = drive(rig(exposurePack(true)), 'a')
    expect(r.fixed[1], 'prose in the slot deleted an authored row').toContain('opened-row')
  })

  it('(c) the ROSTER counts one entry per person, however many rows name them', () => {
    // `narration`'s prompt states that at most one person is on the roster and
    // speaks one line. Two co-timed rows naming the same character reached it
    // as two entries, and two entries read at the far end as two people.
    const r = drive(rig(twinRosterPack()), 'a')
    expect(r.roster[0]).toEqual(['c1'])
    // Both rows still reach the model as what happened — it is the count that
    // was wrong, not the prose.
    expect(r.fixed[0]).toBe('first\nsecond')
  })

  it('(d) the state core is touched only when there IS a predicate to resolve', () => {
    // Keeps §4.1's ordering chain (`beat/ordering.test.ts`) measuring what it
    // says: a pack that authors no condition adds no read to the beat.
    const r = rig(twinRosterPack())
    drive(r, 'a')
    expect(r.state.ops().filter((op) => op === 'snapshot')).toEqual([])
  })
})

/* ══ (b) the pack that ships ════════════════════════════════════════════════ */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const part = <T>(name: string): T =>
  JSON.parse(fs.readFileSync(path.join(REPO, 'data/scenario', PACK_SLUG, `${name}.json`), 'utf8')) as T

const TIMELINE = part<Timeline>('timeline')

/** The pack, asserted to the same types the production loader asserts to. */
function shippedPack(): EnginePack {
  return {
    timeline: TIMELINE,
    gates: part<Gates>('gates'),
    characters: part<Characters>('characters'),
    temperament: part<Temperament>('temperament'),
    symptoms: part<Symptoms>('symptoms'),
  }
}

/** The run's terminates-or-it-is-a-bug bound, as the other rigs spell it. */
const MAX_BEATS = 128

/**
 * Walks the shipped pack with no intervention — every gate answered `null`, so
 * the engine substitutes the authored `default_stance` (spec-engine §5). That
 * is the run a player who does nothing gets, and it is the run the defect was
 * measured on.
 */
function walkShipped(): { handed: string[]; printed: string[]; scenes: string[]; beats: Beat[] } {
  const pack = shippedPack()
  const schedule = buildSchedule(pack.timeline, pack.gates)
  const engine = createEngine({ pack })
  const handed: string[] = []
  const printed: string[] = []
  const scenes: string[] = []
  const beats: Beat[] = []
  for (let step = 0; step < MAX_BEATS; step += 1) {
    const cursor = engine.current()
    const beat = schedule[cursor.index]!
    beats.push(beat)
    if (cursor.kind === 'gate') {
      engine.submitStance(null)
      if (beat.gate !== null) scenes.push(beat.gate.scene)
    }
    engine.applyBeatEffects()
    // Both surfaces of the SAME beat, read in the same breath: the paper the
    // operator gets and the fixed action the model is told already happened.
    for (const line of engine.feed()) printed.push(line.text)
    const fixed = engine.beatView().FIXED_NPC_ACTION
    for (const row of fixed.split('\n')) if (row !== '') handed.push(row)
    if (!engine.advance()) break
  }
  return { handed, printed, scenes, beats }
}

describe(`[e3#F4] the shipped pack (${PACK_SLUG}) hands the model nothing its paper withheld`, () => {
  it('(e) every row in FIXED_NPC_ACTION is a row the run actually printed', () => {
    const { handed, printed, scenes } = walkShipped()
    expect(handed.length, 'the run handed the model nothing — the compare is vacuous').toBeGreaterThan(0)

    // A gate beat with no exposed row falls back to the gate's own scene (D3),
    // which is authored to be read there and is not a timeline row at all.
    const paper = new Set(printed)
    const scene = new Set(scenes)
    const leaked = handed.filter((row) => !paper.has(row) && !scene.has(row))
    expect(
      leaked,
      'a row the paper never printed reached FIXED_NPC_ACTION — the model is told it already happened',
    ).toEqual([])
  })

  it('(f) …and the pack really does author rows that go unexposed, so (e) measures something', () => {
    // Without this, (e) passes on a pack that authors no condition at all —
    // and on the day one is added, silently goes back to measuring nothing.
    const conditional = TIMELINE.events.filter(
      (event) => (event.exposure.extra_condition ?? '') !== '',
    )
    expect(conditional.length, `${PACK_SLUG} authors no conditional row`).toBeGreaterThan(0)

    const { handed } = walkShipped()
    const held = new Set(handed)
    const withheld = conditional.filter((event) => !held.has(event.text))
    expect(
      withheld.length,
      'every conditional row was exposed on the no-intervention run — (e) never exercised the filter',
    ).toBeGreaterThan(0)
  })
})
