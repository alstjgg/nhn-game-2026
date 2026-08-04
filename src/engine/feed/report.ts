/**
 * `buildReportSentences` — Call 3's `facts` and `report_body` become `Sentence`s
 * with `f` and `b` ids.
 *
 * These are `Sentence`, not `FeedLine`, because the seam's `report` ViewEvent
 * carries `Sentence[]`. Same minter, same allocator, same counter discipline —
 * §8-8's "every generated sentence carries an engine-minted id on its own
 * channel" is satisfied on the `Sentence` path for Call 3.
 *
 * `facts` is allocated entirely before `report_body`, which is what makes the
 * round-end order (`f` then `b`) observable in the golden.
 *
 * The body split is `segmentReportBody`'s and only its — invariant 12 made
 * structural. Re-implementing it here would let the engine and the fixture
 * generator disagree on one sentence, and the disagreement would surface as a
 * mined block whose id points at different text depending on which produced it.
 */

import { segmentReportBody } from '../../shared/segment.ts'
import { SPECIES_OF } from '../../shared/species.ts'
import type { Sentence } from '../../shared/view-driver.ts'
import type { IdAllocator } from './id-alloc.ts'
import type { ReportInput } from './types.ts'

export type ReportSentences = { facts: Sentence[]; report_body: Sentence[] }

/**
 * The membrane guard on Call 3's `facts` (CLAUDE.md's membrane rule; call
 * contracts §6's consumer table).
 *
 * `inner_note` is Call 3's INPUT. Everything minted on the `f` channel is
 * output: it lands in the `report` ViewEvent, contract-datapack E2 certifies it
 * as minable, and the player can mine it into the next Call 1's `BLOCKS`. So a
 * fact that reproduces the note verbatim is exactly the thing §6 forbids —
 * "**Call 3 only.** Never shown to the player directly."
 *
 * This guard exists because the model is not the only way the note can get
 * there. It has two sources, and both are real:
 *
 * 1. the engine's own §5 fallback, which fills `facts` from an assembled log —
 *    closed structurally by `assembleObjectiveLog`;
 * 2. a reporter that echoes its own prompt back into `facts`, which no engine
 *    can prevent upstream. The offline fixture provider does exactly this,
 *    deliberately, so this guard is under test on every acceptance run.
 *
 * **Verbatim containment is the whole test.** §6 says the note "leaks only
 * through the report", so a `report_body` that reflects the deliberation in the
 * reporter's own words is the SANCTIONED path and is left alone; a similarity
 * heuristic would start eating those too, and the drop set feeds the `f`
 * numbering, which D1 pins byte-for-byte. The line is dropped whole rather than
 * redacted in place: a "fact" quoting the agent's private deliberation is not a
 * fact about the round.
 */
export function withholdInnerNote(facts: readonly string[], innerNote: string): string[] {
  const note = innerNote.trim()
  if (note === '') return [...facts]
  return facts.filter((fact) => !fact.includes(note))
}

export function buildReportSentences(report: ReportInput, ids: IdAllocator): ReportSentences {
  // Species derives from the channel, never from classification (species.ts).
  const facts: Sentence[] = report.facts.map((text) => ({
    id: ids.next('f'),
    text,
    species: SPECIES_OF.f,
  }))

  const report_body: Sentence[] = segmentReportBody(report.report_body).map((text) => ({
    id: ids.next('b'),
    text,
    species: SPECIES_OF.b,
  }))

  return { facts, report_body }
}
