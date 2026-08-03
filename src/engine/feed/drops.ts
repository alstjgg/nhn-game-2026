/**
 * `npc_lines` parsing and the three soft-drop rules (call contracts §6,
 * "Disposition of a soft-flagged output").
 *
 * A soft flag never discards the response. The offending line is dropped **on
 * the way to the timeline** and the rest of the beat is unaffected — the
 * timeline entries, the utterance, the other npc lines all survive.
 *
 * This module is deliberately allocator-blind. It takes raw strings and returns
 * `kept` + `drops`, and `feed.ts` mints over `kept` only. That is what makes
 * "a dropped line consumes no sequence number" a property of the data flow
 * rather than a rule someone has to remember: there is no allocator in scope
 * here to consume from.
 */

import type { PresentNpc } from '../../shared/contracts.ts'
import type { DropReason, DropRecord, KeptNpcLine } from './types.ts'

/** `"<npc_id>: <line>"` — the prefixed-string shape §2 mandates (nested objects are banned). */
const PREFIXED = /^\s*([^\s:]+)\s*:\s*([\s\S]*)$/

/**
 * Echo comparison is **conservative on purpose**: equality after trimming and
 * collapsing internal whitespace, nothing fuzzier. A similarity threshold would
 * make the drop set depend on a tuning constant, and the drop set decides the
 * `q` numbering — D1 is a byte gate, so it cannot sit downstream of a heuristic.
 */
const collapse = (value: string): string => value.trim().replace(/\s+/g, ' ')

export type NpcLineContext = {
  present: readonly PresentNpc[]
  /** This beat's Call 1 utterance; `''` on a script beat (no echo rule then). */
  utterance: string
}

export type NpcClassification = { kept: KeptNpcLine[]; drops: DropRecord[] }

export function classifyNpcLines(
  raw: readonly string[],
  ctx: NpcLineContext,
): NpcClassification {
  const kept: KeptNpcLine[] = []
  const drops: DropRecord[] = []
  const echo = collapse(ctx.utterance)

  for (let index = 0; index < raw.length; index += 1) {
    const line = raw[index]
    const drop = (reason: DropReason): void => {
      drops.push({ raw: line, reason, index })
    }

    const parsed = PREFIXED.exec(line)
    if (!parsed) {
      // Hard upstream, soft here: the engine never throws on model output.
      drop('missing_prefix')
      continue
    }

    const speakerId = parsed[1]
    const text = parsed[2].trim()

    const speaker = ctx.present.find((npc) => npc.id === speakerId)
    if (!speaker) {
      drop('foreign_speaker')
      continue
    }

    if (echo !== '' && collapse(text) === echo) {
      drop('echoes_utterance')
      continue
    }

    kept.push({ speakerId, speakerName: speaker.name, text })
  }

  return { kept, drops }
}
