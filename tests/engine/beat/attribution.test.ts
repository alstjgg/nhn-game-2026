// [#116 findings B · C] — spec-engine §2.1's `cause` grammar, asserted on the
// injected recording double's log (which records the exact string handed to
// `applyDeltas`/`applyFlags`) and end-to-end on `createEngine().journal()`.
//
// §2.1 is not decoration. The journal rides verbatim into the run record
// (`data/runs/_schema/run-record`), so `cause` is the entire basis of
// attributability, and architecture spec §2's position is that an outcome you
// cannot explain is a bug. Two things were wrong at once and neither had a test:
//
//   B — a Call 1 fallback was indistinguishable from a chosen stance;
//   C — the grammar itself deviated, twice.
import { describe, it, expect } from 'vitest'
import { createEngine } from '../../../src/engine/index.ts'
import { BASELINE_CALL1_CAUSE, FALLBACK_CALL1_CAUSE } from '../../../src/engine/beat/index.ts'
import { rig } from './harness.ts'
import { TRUST_SEED, pack, ev, gate, trustPack } from './fixtures/packs.ts'
import { attributedRound } from '../../driver/engine-fixtures/pack.ts'

/** Every `cause` the double was handed, in the order state received it. */
function causes(state: { entries(op: string): { args: readonly unknown[] }[] }): string[] {
  return [...state.entries('applyDeltas'), ...state.entries('applyFlags')].map(
    (entry) => entry.args[1] as string,
  )
}

describe('[#116 B] a Call 1 fallback is visible in the delta journal', () => {
  it('(a) the literal `fallback:call1` is what §5 names, and the engine exports it', () => {
    expect(FALLBACK_CALL1_CAUSE).toBe('fallback:call1')
  })

  it('(b) a submission whose origin is `fallback` attributes its deltas to fallback:call1', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: '', origin: 'fallback' })
    expect(causes(r.state)).toEqual([FALLBACK_CALL1_CAUSE, FALLBACK_CALL1_CAUSE])
  })

  it('(c) an origin-less submission of the SAME stance does not — the two are distinguishable', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    expect(causes(r.state)).not.toContain(FALLBACK_CALL1_CAUSE)
  })

  // x14 — the THIRD origin. The same authored default, reached because the
  // agent was handed nothing rather than because a call failed. Two literals
  // that shared a prefix would let a reader grepping `fallback:` count these as
  // failures, and on an empty-handover run that is every gate of the run.
  it('(f) `baseline` is its own cause, and shares no prefix with the fallback one', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u', origin: 'baseline' })
    expect(BASELINE_CALL1_CAUSE).toBe('baseline:no-handover')
    expect(causes(r.state)).toEqual([BASELINE_CALL1_CAUSE, BASELINE_CALL1_CAUSE])
    expect(BASELINE_CALL1_CAUSE.startsWith('fallback:')).toBe(false)
    expect(FALLBACK_CALL1_CAUSE.startsWith('baseline:')).toBe(false)
  })

  it('(d) end-to-end: submitStance(null) and submitStance({stance}) no longer agree', () => {
    const journalOf = (response: null | { stance: string }): string[] => {
      const engine = createEngine({ pack: attributedRound(), run: 1 })
      engine.submitStance(
        response === null
          ? null
          : {
              inner_note: 'n',
              stance: response.stance,
              because_referent: 'r',
              because_block_ids: [],
              rejected_stance: 'escalate',
              rejected_reason: 'x',
              utterance: 'u',
            },
      )
      return engine.journal().map((entry) => entry.cause)
    }

    // The authored `default_stance` IS `hold`, so before the fix these two
    // produced byte-identical journals — which is exactly how a fallback run
    // could claim the model judged every gate.
    const substituted = journalOf(null)
    const chosen = journalOf({ stance: 'hold' })
    expect(substituted.length).toBeGreaterThan(0)
    expect(substituted).toEqual([FALLBACK_CALL1_CAUSE])
    expect(chosen).not.toEqual(substituted)
  })

  it('(e) the delta itself still landed — §5 proceeds, it does not skip the bucket', () => {
    const engine = createEngine({ pack: attributedRound(), run: 1 })
    engine.submitStance(null)
    expect(engine.journal()).toEqual([
      { variable: 'trust', before: 0, after: -20, cause: FALLBACK_CALL1_CAUSE },
    ])
  })
})

describe('[#116 C] `cause` is `<gate>:<stance>` and `event:<id>`, per §2.1', () => {
  it('(a) a gate delta is attributed to the STANCE id, never the bucket id', () => {
    const r = rig(trustPack(), { ...TRUST_SEED })
    r.driver.submitStance({ stance: 'a', utterance: 'u' })
    expect(causes(r.state)).toEqual(['G1:a', 'G1:a'])
  })

  it('(b) two stances collapsing into one bucket keep their own attribution', () => {
    // The bucket is a MANY-to-one collapse. Writing its id back into `cause`
    // loses which stance was chosen — permanently, since the journal is what
    // the run record stores.
    const shared = pack(
      [ev('x1', '09:00', { text: 'gate-co-timed' })],
      [
        gate('G1', '09:00', {
          buckets: [{ id: 'ba', stances: ['a', 'b'], deltas: { trust: 5 }, flags: {} }],
        }),
      ],
    )
    const withA = rig(shared, { ...TRUST_SEED })
    withA.driver.submitStance({ stance: 'a', utterance: 'u' })
    const withB = rig(shared, { ...TRUST_SEED })
    withB.driver.submitStance({ stance: 'b', utterance: 'u' })

    expect(causes(withA.state)).toEqual(['G1:a', 'G1:a'])
    expect(causes(withB.state)).toEqual(['G1:b', 'G1:b'])
    expect(causes(withA.state)).not.toEqual(causes(withB.state))
  })

  it('(c) a script event delta is attributed `event:<id>`, not the bare id', () => {
    const scripted = pack([
      ev('t13', '10:40', { effects: { deltas: { alpha: 1 }, flags: { fa: true } } }),
    ])
    const r = rig(scripted)
    r.driver.applyBeatEffects()
    expect(causes(r.state)).toEqual(['event:t13', 'event:t13'])
  })

  it('(d) end-to-end, every journal entry matches one of §2.1’s three forms', () => {
    const engine = createEngine({ pack: attributedRound(), run: 1 })
    engine.submitStance({
      inner_note: 'n',
      stance: 'escalate',
      because_referent: 'r',
      because_block_ids: [],
      rejected_stance: 'hold',
      rejected_reason: 'x',
      utterance: 'u',
    })
    const entries = engine.journal()
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.map((entry) => entry.cause)).toEqual(['G1:escalate'])
    for (const entry of entries) {
      expect(entry.cause).toMatch(/^(?:[^:\s]+:[^:\s]+|event:[^:\s]+|fallback:call1)$/)
    }
  })
})
