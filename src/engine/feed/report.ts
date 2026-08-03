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
