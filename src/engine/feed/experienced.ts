/**
 * The round event assembler (contract-engine-composer §5) — the `EXPERIENCED`
 * slot Call 3 reads.
 *
 * Its input table has exactly three rows: authored script events, every beat's
 * Call 2 output (post-drop), and the gate beat's `utterance` plus `inner_note`.
 * Symptoms are **not** in that table and are excluded here.
 *
 * This is the one place `inner_note` is allowed to be read. It reaches the
 * player only through the report; it never enters a `FeedLine`, never appears
 * on the timeline, and no other view exposes it (§8-5). The note sits
 * immediately **before** its beat's utterance, mirroring call contracts §3's
 * field order — deliberation, then the line that came out of it.
 *
 * Nothing here mints. `EXPERIENCED` is prose handed to a prompt, not sentences
 * the player can mine, so this module takes no allocator — which also keeps a
 * retune of the wording below off the D1 golden entirely.
 */

import { classifyNpcLines } from './drops.ts'
import type { RoundInput, RoundSlots } from './types.ts'

/**
 * Line prefixes, one per §5 row. The exact prose is **provisional**: §5 fixes
 * what goes in and in what order, not how it reads. Keeping it in one frozen
 * table makes a retune a one-line change instead of a hunt.
 */
export const EXPERIENCED_PREFIX = {
  SCRIPT: '',
  INNER_NOTE: '[속내] ',
  UTTERANCE: '[통제실] ',
  TIMELINE: '',
  NPC: '',
} as const

/** Which of the two §5 assemblies is being built — see `assembleObjectiveLog`. */
type Audience = 'call3' | 'objective'

function assemble(round: RoundInput, audience: Audience): string[] {
  const out: string[] = []

  round.beats.forEach((beat, index) => {
    for (const script of beat.scriptLines ?? []) {
      out.push(`${EXPERIENCED_PREFIX.SCRIPT}${script.text}`)
    }

    // The gate belongs to the round, and it is decided once, at its beat.
    if (index === 0) {
      if (audience === 'call3' && round.gate.inner_note !== '') {
        out.push(`${EXPERIENCED_PREFIX.INNER_NOTE}${round.gate.inner_note}`)
      }
      if (round.gate.utterance !== '') {
        out.push(`${EXPERIENCED_PREFIX.UTTERANCE}${round.gate.utterance}`)
      }
    }

    for (const entry of beat.narration?.timeline_entries ?? []) {
      out.push(`${EXPERIENCED_PREFIX.TIMELINE}${entry}`)
    }

    // Same classifier the feed uses, so a line the timeline dropped cannot
    // re-enter the round through the prompt.
    const { kept } = classifyNpcLines(beat.narration?.npc_lines ?? [], {
      present: beat.present,
      utterance: round.gate.utterance,
    })
    for (const npcLine of kept) {
      out.push(`${EXPERIENCED_PREFIX.NPC}${npcLine.speakerName}: ${npcLine.text}`)
    }
  })

  return out
}

/** §5's `EXPERIENCED` — Call 3's input, `inner_note` included. Prompt-only. */
export function assembleExperienced(round: RoundInput): string[] {
  return assemble(round, 'call3')
}

/**
 * The same round, **minus the one line no player may be handed** — the round's
 * `inner_note`.
 *
 * spec-engine §5's Call 3 row fills `facts` "from the engine-assembled objective
 * log" when the reporter never lands. Those facts are minted on the `f` channel,
 * are certified minable by contract-datapack E2, and are emitted verbatim in the
 * `report` ViewEvent — i.e. they are shown to the player directly, which call
 * contracts §6 forbids for `inner_note` ("**Call 3 only.** Never shown to the
 * player directly"). So the fallback's log is a *different* assembly from Call
 * 3's prompt, not the same one reused: the agent's private deliberation is not
 * an objective event, and it is the only §5 row that is not.
 *
 * Everything else — script events, timeline entries, npc lines, the utterance —
 * was already on the player's timeline this round, so it stays.
 */
export function assembleObjectiveLog(round: RoundInput): string[] {
  return assemble(round, 'objective')
}

/**
 * The two slots the round view supplies. `TEMPERAMENT` crosses **by reference**:
 * Call 1 and Call 3 must get the identical object (§8-6), so the assembler
 * never copies, clones, or re-renders the pack.
 */
export function roundSlots(round: RoundInput): RoundSlots {
  return {
    EXPERIENCED: assembleExperienced(round),
    TEMPERAMENT: round.temperament,
  }
}
