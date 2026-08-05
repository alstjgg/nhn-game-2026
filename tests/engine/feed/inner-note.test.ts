// [e4#A4] — contract-engine-composer §8-5 and §5: `inner_note` reaches Call 3
// and nothing else. It enters `EXPERIENCED` and reaches the player only through
// the report; the engine must not place it on the timeline, and no other view
// may expose it.
//
// Guarded twice, as A4 requires: a runtime guard against a polluted fixture,
// and a source-text guard that reads `src/engine/feed/**` from disk.
//
// This file also carries the §5 EXPERIENCED assembly assertions, because
// `assembleExperienced` is the one function `inner_note` is allowed to reach.
// Line PROSE is provisional (spec decision 7 / design D-5), so the assertions
// are on containment and order — never on the exact rendered wording.
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createIdAllocator,
  buildFeed,
  buildReportSentences,
  assembleExperienced,
  assembleObjectiveLog,
  roundSlots,
  withholdInnerNote,
} from '../../../src/engine/feed/index.ts'
import {
  GOLDEN_BEAT,
  GOLDEN_REPORT,
  GOLDEN_ROUND,
  INNER_NOTE,
  UTTERANCE,
  SCRIPT_LINE,
  TIMELINE_ENTRIES,
  SYMPTOM,
  FOREIGN_NPC_TEXT,
} from './__fixtures__/beat.ts'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const FEED_DIR = path.join(REPO, 'src/engine/feed')

/**
 * Files allowed to name `inner_note` at all (design D-4).
 *
 * `report.ts` joined the set in the #116 review: the note's one live route to
 * the player was Call 3's `facts`, and the guard that closes it
 * (`withholdInnerNote`) has to name the thing it withholds. A census that only
 * ever grows is not a test, so (h2)/(h3) below pin the guard's BEHAVIOUR — and
 * (o)–(r) pin the second assembly the fallback path now reads.
 */
const INNER_NOTE_OWNERS = new Set(['experienced.ts', 'types.ts', 'report.ts'])

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

const experienced = () => assembleExperienced(GOLDEN_ROUND)

describe('[e4#A4] runtime — the polluted fixture', () => {
  it('(a) inner_note appears in assembleExperienced() output', () => {
    expect(experienced().some((l) => l.includes(INNER_NOTE))).toBe(true)
  })

  it('(b) inner_note appears in NO FeedLine.text and NO FeedLine.speaker', () => {
    const lines = buildFeed(GOLDEN_BEAT, createIdAllocator(1)).lines
    for (const line of lines) {
      expect(line.text, 'inner_note reached a feed line').not.toContain(INNER_NOTE)
      expect(line.speaker ?? '').not.toContain(INNER_NOTE)
    }
  })

  it('(c) inner_note reaches no timeline line (kind:"event") in particular', () => {
    const timeline = buildFeed(GOLDEN_BEAT, createIdAllocator(1)).lines.filter(
      (l) => l.kind === 'event',
    )
    expect(JSON.stringify(timeline)).not.toContain(INNER_NOTE)
  })

  it('(d) the whole FeedResult, serialised, is free of inner_note', () => {
    const result = buildFeed(GOLDEN_BEAT, createIdAllocator(1))
    expect(JSON.stringify(result)).not.toContain(INNER_NOTE)
  })

  it('(e) buildFeed cannot see inner_note even when the caller shoves it in', () => {
    const polluted = {
      ...GOLDEN_BEAT,
      judgment: { utterance: UTTERANCE, inner_note: INNER_NOTE },
    } as typeof GOLDEN_BEAT
    expect(JSON.stringify(buildFeed(polluted, createIdAllocator(1)))).not.toContain(INNER_NOTE)
  })

  it('(f) the report sentences carry no inner_note', () => {
    const report = buildReportSentences(GOLDEN_REPORT, createIdAllocator(1))
    expect(JSON.stringify(report)).not.toContain(INNER_NOTE)
  })

  it('(g) roundSlots exposes inner_note only inside EXPERIENCED, never on TEMPERAMENT', () => {
    const slots = roundSlots(GOLDEN_ROUND)
    expect(JSON.stringify(slots.TEMPERAMENT)).not.toContain(INNER_NOTE)
    expect(Object.keys(slots).sort()).toEqual(['EXPERIENCED', 'TEMPERAMENT'])
    expect(slots.EXPERIENCED.some((l) => l.includes(INNER_NOTE))).toBe(true)
  })
})

describe('[e4#A4] source text — src/engine/feed/** never writes inner_note into a FeedLine', () => {
  it('(h) only experienced.ts and types.ts mention inner_note at all', () => {
    const offenders = walk(FEED_DIR).filter(
      (f) =>
        !INNER_NOTE_OWNERS.has(path.basename(f)) &&
        /inner_note/.test(fs.readFileSync(f, 'utf8')),
    )
    expect(offenders.map((f) => path.relative(REPO, f))).toEqual([])
  })

  it('(h2) `withholdInnerNote` drops a fact that carries the note, and only that fact', () => {
    const facts = ['관측소가 신호를 놓쳤다.', `[속내] ${INNER_NOTE}`, '회선이 닫혔다.']
    expect(withholdInnerNote(facts, INNER_NOTE)).toEqual([
      '관측소가 신호를 놓쳤다.',
      '회선이 닫혔다.',
    ])
  })

  it('(h3) a reporter echoing the note into `facts` mints nothing that carries it', () => {
    // The success path: Call 3 answered, and its answer quoted its own prompt.
    const echoed = { facts: [`[속내] ${INNER_NOTE}`, UTTERANCE], report_body: '기록을 남겼다.' }
    const minted = buildReportSentences(
      { ...echoed, facts: withholdInnerNote(echoed.facts, INNER_NOTE) },
      createIdAllocator(1),
    )
    expect(JSON.stringify(minted)).not.toContain(INNER_NOTE)
    // Not vacuous, and the withheld line consumed no `f` sequence number.
    expect(minted.facts.map((s) => s.text)).toEqual([UTTERANCE])
    expect(minted.facts.map((s) => s.id)).toEqual(['b-r1-f01'])
  })

  it('(h4) an empty note withholds nothing — a script beat has no deliberation', () => {
    const facts = ['관측소가 신호를 놓쳤다.', '']
    expect(withholdInnerNote(facts, '')).toEqual(facts)
    expect(withholdInnerNote(facts, '   ')).toEqual(facts)
  })

  it('(i) the module folder exists and is not empty (the guard has something to guard)', () => {
    expect(walk(FEED_DIR).length).toBeGreaterThan(0)
  })
})

// spec-engine §5's Call 3 row fills `facts` from "the engine-assembled objective
// log". Before the #116 review that log WAS `assembleExperienced` — so a round
// whose reporter never landed minted the note on the `f` channel with no model
// in the loop. The two assemblies have different audiences and are now two
// functions; these pin the difference to exactly one line.
describe('[e4] §5 the objective log is not the Call 3 prompt', () => {
  it('(o) assembleObjectiveLog omits the inner_note line', () => {
    expect(assembleObjectiveLog(GOLDEN_ROUND).some((l) => l.includes(INNER_NOTE))).toBe(false)
  })

  it('(p) …and differs from EXPERIENCED in exactly that one line', () => {
    const full = assembleExperienced(GOLDEN_ROUND)
    const objective = assembleObjectiveLog(GOLDEN_ROUND)
    expect(objective).toEqual(full.filter((line) => !line.includes(INNER_NOTE)))
    expect(objective.length).toBe(full.length - 1)
  })

  it('(q) the utterance stays — it was already on the player’s timeline this round', () => {
    expect(assembleObjectiveLog(GOLDEN_ROUND).some((l) => l.includes(UTTERANCE))).toBe(true)
    expect(assembleObjectiveLog(GOLDEN_ROUND)[0]).toBe(assembleExperienced(GOLDEN_ROUND)[0])
  })

  it('(r) with no note authored the two assemblies are identical', () => {
    const noteless = { ...GOLDEN_ROUND, gate: { ...GOLDEN_ROUND.gate, inner_note: '' } }
    expect(assembleObjectiveLog(noteless)).toEqual(assembleExperienced(noteless))
  })
})

describe('[e4] §5 EXPERIENCED assembly', () => {
  it('(j) inner_note sits immediately BEFORE its beat\'s utterance', () => {
    const lines = experienced()
    const noteAt = lines.findIndex((l) => l.includes(INNER_NOTE))
    const uttAt = lines.findIndex((l) => l.includes(UTTERANCE))
    expect(noteAt).toBeGreaterThanOrEqual(0)
    expect(uttAt).toBe(noteAt + 1)
  })

  it('(k) it returns string[] — one line per event, in timeline occurrence order', () => {
    const lines = experienced()
    expect(Array.isArray(lines)).toBe(true)
    expect(lines.every((l) => typeof l === 'string')).toBe(true)
    // script · inner_note · utterance · 2 timeline_entries · 2 surviving npc lines
    expect(lines.length).toBe(7)
    const at = (needle: string) => lines.findIndex((l) => l.includes(needle))
    expect(at(SCRIPT_LINE.text)).toBe(0)
    expect(at(TIMELINE_ENTRIES[0])).toBeLessThan(at(TIMELINE_ENTRIES[1]))
    expect(at(TIMELINE_ENTRIES[1])).toBeLessThan(at('문 좀 열어주세요.'))
    expect(at('문 좀 열어주세요.')).toBeLessThan(at('조용히 해.'))
  })

  it('(l) symptoms are excluded — they are not in §5\'s input table', () => {
    expect(experienced().join('\n')).not.toContain(SYMPTOM)
  })

  it('(m) a dropped npc line reaches EXPERIENCED no more than the timeline does', () => {
    expect(experienced().join('\n')).not.toContain(FOREIGN_NPC_TEXT)
  })

  it('(n) assembleExperienced is the ONLY export that reads inner_note', () => {
    const withNote = assembleExperienced(GOLDEN_ROUND)
    const withoutNote = assembleExperienced({
      ...GOLDEN_ROUND,
      gate: { ...GOLDEN_ROUND.gate, inner_note: '' },
    })
    expect(withNote).not.toEqual(withoutNote)
  })
})
