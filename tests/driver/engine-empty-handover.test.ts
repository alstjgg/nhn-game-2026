// [x14] AN AGENT HANDED NOTHING IS NOT ASKED — it takes the authored default.
//
// Every gate in every pack already carries this claim, in prose, as its
// `standard_form`: `갈림길 G1에서, 아무것도 넘겨받지 않은 요원은 기본 stance a를
// 낸다`. Nothing made it true. The claim went to a model as one option among
// four alongside three that read as better ideas, and the model reached past it
// often enough that 멈춘회전문's G3 stances had to be REWRITTEN — `이유가 아니라
// 무행동이라 아무것도 넘겨받지 않은 요원도 b·c를 골랐다` — to argue it into
// compliance. Prompt-shaped compliance is not determinism, and the run it
// failed on is run 1: the one a judge sees first and the one the player has,
// by definition, not touched yet.
//
// So the driver stops asking. Three properties, and this file is each of them:
//
//   (A) no Call 1 is composed or sent when the handover is empty;
//   (B) the gate still resolves — to the pack's `default_stance`, identically
//       on every run, and the agent still SPEAKS (silence reads as broken);
//   (C) the run record says which of the two no-model paths this was. A gate
//       nobody asked about is not a gate whose call failed, and the journal is
//       the only place that distinction survives the run.
import { describe, expect, it } from 'vitest'

import { BASELINE_CALL1_CAUSE, FALLBACK_CALL1_CAUSE } from '../../src/engine/beat/index.ts'
import { buildSchedule } from '../../src/engine/beat/schedule.ts'
import { createEngine } from '../../src/engine/index.ts'
import type { ViewEvent } from '../../src/shared/view-driver.ts'
import { drain, makeRig, spyOn } from './engine-fixtures/rig.ts'
import { attributedRound, scriptedRound, twoRounds } from './engine-fixtures/pack.ts'
import { createFixtureProvider } from '../../src/transport/index.ts'

const callTypes = (events: ViewEvent[]): string[] =>
  events.flatMap((event) => (event.type === 'waiting' && event.active ? [event.for] : []))

const radioLines = (events: ViewEvent[]): string[] =>
  events.flatMap((event) =>
    event.type === 'feed' && event.line.kind === 'radio' ? [event.line.text] : [],
  )

/** The pack's own answer for the first gate: default stance → its label. */
function authoredBaseline(pack = scriptedRound()): { stance: string; line: string } {
  const gate = buildSchedule(pack.timeline, pack.gates).find((beat) => beat.gate !== null)?.gate
  if (gate === undefined || gate === null) throw new Error('the fixture pack authors no gate')
  return { stance: gate.defaultStance, line: gate.baselineUtterance }
}

/* ══ (A) the call is not made ═══════════════════════════════════════════════ */

describe('[x14#A] an empty handover composes no Call 1 at all', () => {
  it('(a) a virgin run sends narration and reporter — and no judgment', async () => {
    const transport = spyOn(createFixtureProvider())
    await drain(makeRig({ pack: twoRounds(), transport }))
    expect(transport.types()).not.toContain('judgment')
    // Not vacuous: the run really did happen, and the other two calls prove it.
    expect(transport.types()).toContain('narration')
    expect(transport.types()).toContain('reporter')
  })

  it('(b) …and no `waiting:judgment` bracket is opened either', async () => {
    const events = await drain(makeRig({ pack: twoRounds() }))
    expect(callTypes(events)).not.toContain('judgment')
  })

  it('(c) the SAME run, shaped, asks every gate — the skip is the handover, not the pack', async () => {
    const transport = spyOn(createFixtureProvider())
    await drain(makeRig({ shaped: true, pack: twoRounds(), transport }))
    expect(transport.types().filter((type) => type === 'judgment')).toHaveLength(2)
  })

  it('(d) an unasked call is not a FAILED one — nothing prints `※ 회신 불량`', async () => {
    // The distinction is the operator's: a fallback notice on a virgin run
    // would tell them the desk is broken on the one run where nothing is.
    const events = await drain(makeRig({ pack: twoRounds() }))
    expect(events.filter((event) => event.type === 'fallback')).toEqual([])
  })
})

/* ══ (B) the gate still resolves, and the agent still speaks ════════════════ */

describe('[x14#B] the gate resolves to the pack, deterministically', () => {
  it('(a) the report carries the authored default stance', async () => {
    const events = await drain(makeRig())
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports).toHaveLength(1)
    expect(reports[0]?.judged?.stance_id).toBe(authoredBaseline().stance)
  })

  it('(b) the agent SPEAKS — the baseline line, on the paper, from the pack', async () => {
    const { line } = authoredBaseline()
    expect(line, 'the fixture gate resolved an empty baseline').not.toBe('')
    const events = await drain(makeRig())
    expect(radioLines(events)).toContain(line)
  })

  it('(c) two virgin runs are identical, which is the whole purchase', async () => {
    const strip = (events: ViewEvent[]): string =>
      JSON.stringify(events.filter((event) => event.type !== 'waiting'))
    expect(strip(await drain(makeRig({ pack: twoRounds() })))).toBe(
      strip(await drain(makeRig({ pack: twoRounds() }))),
    )
  })

  it('(d) a shaped run can still reach a DIFFERENT stance — this is not a lock', async () => {
    const rig = makeRig({
      shaped: true,
      responses: {
        judgment: {
          inner_note: 'n',
          stance: 'escalate',
          because_referent: 'r',
          because_block_ids: [],
          rejected_stance: 'hold',
          rejected_reason: 'x',
          utterance: '올린다.',
        },
      },
    })
    const events = await drain(rig)
    const reports = events.flatMap((event) => (event.type === 'report' ? [event] : []))
    expect(reports[0]?.judged?.stance_id).toBe('escalate')
    expect(reports[0]?.judged?.stance_id).not.toBe(authoredBaseline().stance)
  })
})

/* ══ (C) the record tells the two no-model paths apart ══════════════════════ */

describe('[x14#C] the journal separates “never asked” from “asked and failed”', () => {
  // `attributedRound` and not `scriptedRound`: the plain fixture's bucket
  // carries no deltas, so its journal is empty and every cause assertion here
  // would pass over nothing at all.
  it('(a) an empty handover attributes its deltas to the baseline cause', () => {
    const engine = createEngine({ pack: attributedRound(), run: 1 })
    engine.submitBaseline()
    const causes = engine.journal().map((entry) => entry.cause)
    expect(causes.length).toBeGreaterThan(0)
    expect(new Set(causes)).toEqual(new Set([BASELINE_CALL1_CAUSE]))
    expect(causes).not.toContain(FALLBACK_CALL1_CAUSE)
  })

  it('(b) the two paths reach the same stance and never the same record', () => {
    const journalOf = (baseline: boolean): string[] => {
      const engine = createEngine({ pack: attributedRound(), run: 1 })
      const judged = baseline ? engine.submitBaseline() : engine.submitStance(null)
      // Same stance — that is why the cause has to carry the difference.
      expect(judged?.stance_id).toBe(authoredBaseline().stance)
      return engine.journal().map((entry) => entry.cause)
    }
    expect(journalOf(true)).not.toEqual(journalOf(false))
  })

  it('(c) the baseline path mints an utterance where the fallback path mints none', () => {
    const utteranceOf = (baseline: boolean): string => {
      const engine = createEngine({ pack: scriptedRound(), run: 1 })
      if (baseline) engine.submitBaseline()
      else engine.submitStance(null)
      engine.applyBeatEffects()
      return engine.beatView().AGENT_UTTERANCE
    }
    expect(utteranceOf(true)).toBe(authoredBaseline().line)
    // A failed call leaves the agent with nothing to have said, and §5 is
    // unchanged there: it is the one path where the silence is the truth.
    expect(utteranceOf(false)).toBe('')
  })

  it('(d) the driver reaches the baseline entry point, not `submitStance(null)`', async () => {
    // Reading the ENGINE calls, not the stream: a driver that routed an empty
    // handover through the fallback path would produce an identical stream and
    // a run record that says every first run failed its judgment call.
    const seen: string[] = []
    await drain(
      makeRig({
        wrapEngine: (engine) => ({
          ...engine,
          submitStance: (response) => {
            seen.push('submitStance')
            return engine.submitStance(response)
          },
          submitBaseline: () => {
            seen.push('submitBaseline')
            return engine.submitBaseline()
          },
        }),
      }),
    )
    expect(seen).toEqual(['submitBaseline'])
  })
})

/* ══ the resolution rule itself ═════════════════════════════════════════════ */

describe('[x14#D] a gate always has a baseline line to speak', () => {
  it('(a) absent an authored one, it is the DEFAULT stance’s label — not another’s', () => {
    const pack = scriptedRound()
    const authored = pack.gates.gates[0]!
    const gate = buildSchedule(pack.timeline, pack.gates).find((b) => b.gate !== null)!.gate!
    const chosen = authored.stances.find((stance) => stance.id === authored.default_stance)
    expect(gate.baselineUtterance).toBe(chosen?.label)
    // The other stances' labels are what a wrong lookup would return.
    for (const stance of authored.stances) {
      if (stance.id !== authored.default_stance) expect(gate.baselineUtterance).not.toBe(stance.label)
    }
  })

  it('(b) an authored `baseline_utterance` wins, and is trimmed', () => {
    const pack = scriptedRound()
    const gates = {
      gates: pack.gates.gates.map((gate) => ({ ...gate, baseline_utterance: '  달리 볼 까닭이 없다.  ' })),
    }
    const gate = buildSchedule(pack.timeline, gates).find((b) => b.gate !== null)!.gate!
    expect(gate.baselineUtterance).toBe('달리 볼 까닭이 없다.')
  })

  it('(c) a blank authored value falls back rather than silencing the agent', () => {
    const pack = scriptedRound()
    for (const blank of ['', '   ', null]) {
      const gates = { gates: pack.gates.gates.map((gate) => ({ ...gate, baseline_utterance: blank })) }
      const gate = buildSchedule(pack.timeline, gates).find((b) => b.gate !== null)!.gate!
      expect(gate.baselineUtterance, `baseline_utterance=${JSON.stringify(blank)}`).not.toBe('')
    }
  })

  it('(d) the SHIPPED pack answers for every gate it authors', async () => {
    const { PACK_SLUG } = await import('../../src/client/shell/pack.ts')
    const fs = await import('node:fs')
    const path = await import('node:path')
    const url = await import('node:url')
    const repo = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..')
    const read = (name: string): never =>
      JSON.parse(
        fs.readFileSync(path.join(repo, 'data/scenario', PACK_SLUG, `${name}.json`), 'utf8'),
      ) as never
    const schedule = buildSchedule(read('timeline'), read('gates'))
    const gates = schedule.flatMap((beat) => (beat.gate === null ? [] : [beat.gate]))
    expect(gates.length).toBeGreaterThan(0)
    for (const gate of gates) {
      expect(gate.baselineUtterance, `${gate.id} has no line for an unshaped agent`).not.toBe('')
    }
  })
})
