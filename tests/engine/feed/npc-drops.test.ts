// [e4#A5][e4#A6][e4#A7] — decision 9 / contract-calls §6 "Disposition of a
// soft-flagged output": a soft flag never discards the response; the offending
// npc line is dropped **on the way to the timeline**, and the beat's
// `timeline_entries` are unaffected. A beat whose every npc line drops is legal.
//
// A6 is the one that is easy to get wrong and expensive to get wrong: the drop
// must precede the mint, so a dropped line consumes no sequence number.
import { describe, it, expect } from 'vitest'

import { parseSentenceId } from '../../../src/shared/id.ts'
import {
  createIdAllocator,
  buildFeed,
  classifyNpcLines,
  assembleExperienced,
} from '../../../src/engine/feed/index.ts'
import {
  GOLDEN_BEAT,
  GOLDEN_ROUND,
  EMPTY_ROSTER_BEAT,
  PRESENT,
  UTTERANCE,
  TIMELINE_ENTRIES,
  FOREIGN_NPC_LINE,
  FOREIGN_NPC_TEXT,
} from './__fixtures__/beat.ts'

const feed = (beat = GOLDEN_BEAT, run = 1) => buildFeed(beat, createIdAllocator(run))
const npcOf = (beat = GOLDEN_BEAT) => feed(beat).lines.filter((l) => l.kind === 'npc')

describe('[e4#A5] a foreign speaker is soft — the line is dropped, the beat survives', () => {
  it('(a) the foreign line produces no feed line', () => {
    expect(feed().lines.map((l) => l.text)).not.toContain(FOREIGN_NPC_TEXT)
  })

  it('(b) the foreign line produces no EXPERIENCED line', () => {
    expect(assembleExperienced(GOLDEN_ROUND).join('\n')).not.toContain(FOREIGN_NPC_TEXT)
  })

  it('(c) the same beat\'s timeline_entries all survive', () => {
    const texts = feed().lines.map((l) => l.text)
    for (const entry of TIMELINE_ENTRIES) expect(texts).toContain(entry)
  })

  it('(d) the two roster lines survive, attributed to their display names', () => {
    expect(npcOf().map((l) => [l.speaker, l.text])).toEqual([
      ['박 주임', '문 좀 열어주세요.'],
      ['이 반장', '조용히 해.'],
    ])
  })

  it('(e) the drop is reported as a diagnostic, never rendered', () => {
    const { drops } = feed()
    expect(drops).toHaveLength(1)
    expect(drops[0]!.reason).toBe('foreign_speaker')
    expect(drops[0]!.index).toBe(1)
    expect(drops[0]!.raw).toBe(FOREIGN_NPC_LINE)
  })

  it('(f) a beat whose every npc line drops is legal — zero npc lines, no throw', () => {
    const beat = {
      ...GOLDEN_BEAT,
      narration: {
        timeline_entries: [...TIMELINE_ENTRIES],
        npc_lines: ['ghost: 나도 여기 있었어.', 'stranger: 문 열어.'],
      },
    }
    expect(() => feed(beat)).not.toThrow()
    expect(npcOf(beat)).toEqual([])
    expect(feed(beat).drops).toHaveLength(2)
    expect(feed(beat).lines.map((l) => l.text)).toEqual(
      expect.arrayContaining([...TIMELINE_ENTRIES]),
    )
  })

  it('(g) the engine never throws on model output — a missing `id:` prefix is soft too', () => {
    const beat = {
      ...GOLDEN_BEAT,
      narration: { timeline_entries: [], npc_lines: ['문 좀 열어주세요.', 'n1: 알겠습니다.'] },
    }
    const { lines, drops } = feed(beat)
    expect(drops.map((d) => d.reason)).toEqual(['missing_prefix'])
    expect(lines.filter((l) => l.kind === 'npc').map((l) => l.text)).toEqual(['알겠습니다.'])
  })

  it('(h) an npc line that echoes the controller utterance is dropped', () => {
    const beat = {
      ...GOLDEN_BEAT,
      narration: {
        timeline_entries: [],
        npc_lines: [`n1:   ${UTTERANCE.replace(' ', '  ')} `, 'n2: 알겠습니다.'],
      },
    }
    const { lines, drops } = feed(beat)
    expect(drops.map((d) => d.reason)).toEqual(['echoes_utterance'])
    expect(lines.filter((l) => l.kind === 'npc').map((l) => l.text)).toEqual(['알겠습니다.'])
  })

  it('(i) echo detection is conservative — a merely similar line is kept', () => {
    const beat = {
      ...GOLDEN_BEAT,
      narration: { timeline_entries: [], npc_lines: [`n1: ${UTTERANCE}요?`] },
    }
    expect(feed(beat).drops).toEqual([])
    expect(feed(beat).lines.filter((l) => l.kind === 'npc')).toHaveLength(1)
  })
})

describe('[e4#A6] a dropped line consumes no sequence number', () => {
  it('(j) the survivor after the drop gets q02, not q03', () => {
    expect(npcOf().map((l) => l.sentence_id)).toEqual(['b-r1-q01', 'b-r1-q02'])
  })

  it('(k) the `q` counter advanced by exactly the number of surviving lines', () => {
    const ids = createIdAllocator(1)
    buildFeed(GOLDEN_BEAT, ids)
    expect(ids.used('q')).toBe(2)
  })

  it('(l) the q ids are identical to the same beat with the foreign line never sent', () => {
    const clean = {
      ...GOLDEN_BEAT,
      narration: {
        timeline_entries: [...TIMELINE_ENTRIES],
        npc_lines: ['n1: 문 좀 열어주세요.', 'n2: 조용히 해.'],
      },
    }
    expect(npcOf().map((l) => l.sentence_id)).toEqual(npcOf(clean).map((l) => l.sentence_id))
  })

  it('(m) drops do not shift the `n` or `u` counters either', () => {
    const ids = createIdAllocator(1)
    buildFeed(GOLDEN_BEAT, ids)
    expect([ids.used('u'), ids.used('n')]).toEqual([1, 2])
  })

  it('(n) classifyNpcLines is pure and never sees an allocator — no id on a kept line', () => {
    const { kept, drops } = classifyNpcLines(GOLDEN_BEAT.narration!.npc_lines!, {
      present: PRESENT,
      utterance: UTTERANCE,
    })
    expect(kept.map((k) => k.speakerId)).toEqual(['n1', 'n2'])
    expect(kept.map((k) => k.speakerName)).toEqual(['박 주임', '이 반장'])
    expect(drops.map((d) => d.index)).toEqual([1])
    expect(JSON.stringify(kept)).not.toMatch(/b-r\d+-/)
  })
})

describe('[e4#A7] an empty PRESENT_NPCS roster is legal', () => {
  it('(o) every npc line drops, nothing throws', () => {
    expect(() => feed(EMPTY_ROSTER_BEAT)).not.toThrow()
    expect(npcOf(EMPTY_ROSTER_BEAT)).toEqual([])
  })

  it('(p) the drop count is reported', () => {
    expect(feed(EMPTY_ROSTER_BEAT).drops).toHaveLength(2)
    expect(new Set(feed(EMPTY_ROSTER_BEAT).drops.map((d) => d.reason))).toEqual(
      new Set(['foreign_speaker']),
    )
  })

  it('(q) the beat still renders — timeline_entries are untouched and minted on `n`', () => {
    const lines = feed(EMPTY_ROSTER_BEAT).lines
    const entry = lines.find((l) => l.text === '팩스 한 장이 트레이 위로 떨어진다.')
    expect(entry).toBeDefined()
    expect(parseSentenceId(entry!.sentence_id!).channel).toBe('n')
  })

  it('(r) no `q` id was minted at all', () => {
    const ids = createIdAllocator(1)
    buildFeed(EMPTY_ROSTER_BEAT, ids)
    expect(ids.used('q')).toBe(0)
  })
})
