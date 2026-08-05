/**
 * `buildFeed` — one beat in, one ordered `FeedLine[]` out, ids already minted.
 *
 * The emission order **is** the id order, and the id order is the D1 golden:
 *
 *   authored script events (`t*`, no mint) → the utterance (`u`) →
 *   `timeline_entries` (`n`, array order) → surviving `npc_lines` (`q`, array
 *   order, after drops) → symptoms (no mint)
 *
 * Two lines carry no `sentence_id` at all, for opposite reasons:
 *
 * - **script events** already have one — `timeline.json`'s authored `t*` id,
 *   copied verbatim. It is run-independent, so the same script line is
 *   byte-identical in run 1 and run 42.
 * - **symptoms** must never get one. They are fixed authored sentences,
 *   identical every run, so mining one carries no information; a minable
 *   symptom is a regression, not a feature (§8-9).
 */

import type { FeedLine } from '../../shared/view-driver.ts'
import { classifyNpcLines } from './drops.ts'
import type { IdAllocator } from './id-alloc.ts'
import type { BeatFeedInput, FeedResult } from './types.ts'

export function buildFeed(beat: BeatFeedInput, ids: IdAllocator): FeedResult {
  const clock = beat.clock
  const lines: FeedLine[] = []

  for (const script of beat.scriptLines ?? []) {
    lines.push({ kind: 'event', clock, text: script.text, sentence_id: script.id })
  }

  // The only field of Call 1's response that reaches the timeline.
  const utterance = beat.judgment?.utterance ?? ''
  if (utterance !== '') {
    lines.push({ kind: 'radio', clock, text: utterance, sentence_id: ids.next('u') })
  }

  for (const entry of beat.narration?.timeline_entries ?? []) {
    lines.push({ kind: 'event', clock, text: entry, sentence_id: ids.next('n') })
  }

  // Drops resolve before the first `q` is minted — see drops.ts.
  const { kept, drops } = classifyNpcLines(beat.narration?.npc_lines ?? [], {
    present: beat.present,
    utterance,
  })
  for (const npcLine of kept) {
    lines.push({
      kind: 'npc',
      clock,
      speaker: npcLine.speakerName,
      text: npcLine.text,
      sentence_id: ids.next('q'),
    })
  }

  for (const symptom of beat.symptoms ?? []) {
    lines.push({ kind: 'symptom', clock, text: symptom })
  }

  return { lines, drops }
}
