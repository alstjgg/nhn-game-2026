// [#116 finding G] — contract-engine-composer §5: a round's `EXPERIENCED` is
// the timeline's own ordering, "rather than being a second, divergent log".
//
// The npc-line drop rules decide what reaches the timeline, and one of them —
// `echoes_utterance` — is a function of THIS beat's Call 1 utterance, which is
// `''` on a script beat because no Call 1 ran there. The round assembler was
// classifying every beat against the round's GATE utterance, so a script-beat
// line word-for-word identical to the gate utterance was kept on the timeline
// and dropped from the round. The player could mine it; the reporter never saw
// it happen.
//
// Driven end to end through the shipped `createEngine` and `createLiveDriver`,
// because the divergence is between two call sites that only meet in a run.
import { describe, it, expect } from 'vitest'
import type { CallRequest } from '../../src/shared/contracts.ts'
import { drain, makeRig, spyOn } from './engine-fixtures/rig.ts'
import { scriptedRound } from './engine-fixtures/pack.ts'
import { createFixtureProvider } from '../../src/transport/index.ts'

const UTTERANCE = '기록을 남긴다.'

/**
 * Call 1 answers with `UTTERANCE`; Call 2 answers, on EVERY beat, with an npc
 * line whose text is that same utterance, from each side's speaker.
 *
 * `scriptedRound()` puts c1 on the gate beat and c2 on the script beat, so
 * exactly one of the two lines has a present speaker per beat — which makes the
 * echo rule, not the roster rule, the thing under test on each.
 */
function echoingProvider() {
  return createFixtureProvider({
    judgment: {
      inner_note: '기록이 남는 쪽을 고른다.',
      stance: 'hold',
      because_referent: 'r',
      because_block_ids: [],
      rejected_stance: 'escalate',
      rejected_reason: 'x',
      utterance: UTTERANCE,
    },
    narration: {
      timeline_entries: [],
      npc_lines: [`c1: ${UTTERANCE}`, `c2: ${UTTERANCE}`],
    },
  })
}

async function run(): Promise<{ npcLines: string[]; experienced: string[] }> {
  const transport = spyOn(echoingProvider())
  const events = await drain(makeRig({ pack: scriptedRound(), transport }))

  const npcLines = events.flatMap((event) =>
    event.type === 'feed' && event.line.kind === 'npc'
      ? [`${event.line.speaker}: ${event.line.text}`]
      : [],
  )
  const reporter = transport.sent.find(
    (request: CallRequest) => request.call_type === 'reporter',
  )
  const slots = (reporter?.slots ?? {}) as Record<string, unknown>
  const experienced = (slots['EXPERIENCED'] ?? []) as string[]
  return { npcLines, experienced }
}

describe('[#116 G] EXPERIENCED is the timeline’s log, not a second one', () => {
  it('(a) the gate beat’s echo is dropped from BOTH — the rule is on where it should be', async () => {
    const { npcLines, experienced } = await run()
    // c1 is present only on the gate beat, where the utterance is non-empty.
    expect(npcLines.filter((line) => line.startsWith('신고자: '))).toEqual([])
    expect(experienced.filter((line) => line.startsWith('신고자: '))).toEqual([])
  })

  it('(b) the script beat’s identical line reaches the timeline — no Call 1, no echo rule', async () => {
    const { npcLines } = await run()
    expect(npcLines).toEqual([`실장: ${UTTERANCE}`])
  })

  it('(c) …and the same line reaches EXPERIENCED. This is the regression.', async () => {
    const { experienced } = await run()
    expect(experienced).toContain(`실장: ${UTTERANCE}`)
  })

  it('(d) every npc line the player was shown appears in the round’s log, in order', async () => {
    const { npcLines, experienced } = await run()
    expect(npcLines.length).toBeGreaterThan(0)
    expect(experienced.filter((line) => npcLines.includes(line))).toEqual(npcLines)
  })

  it('(e) a well-formed run is unaffected — the ordinary fixture still agrees', async () => {
    const transport = spyOn(createFixtureProvider())
    const events = await drain(makeRig({ pack: scriptedRound(), transport }))
    const npcLines = events.flatMap((event) =>
      event.type === 'feed' && event.line.kind === 'npc'
        ? [`${event.line.speaker}: ${event.line.text}`]
        : [],
    )
    const reporter = transport.sent.find((request) => request.call_type === 'reporter')
    const experienced = ((reporter?.slots ?? {}) as Record<string, unknown>)[
      'EXPERIENCED'
    ] as string[]
    expect(npcLines.length).toBeGreaterThan(0)
    expect(experienced.filter((line) => npcLines.includes(line))).toEqual(npcLines)
  })
})
