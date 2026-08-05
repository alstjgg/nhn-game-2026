/**
 * The driver's block store (spec decision 8) — id → text, built from what the
 * player actually saw.
 *
 * Two tiers, and the split is the point:
 *
 * - **seen** — every emitted feed line that carries a `sentence_id`, plus every
 *   report `Sentence`. Symptom lines carry no id (contract-engine-composer §8-9:
 *   they are fixed authored sentences, identical every run, so mining one
 *   carries no information) and therefore never enter this tier at all.
 * - **mined** — the subset the player mined. `get` reads this tier and only
 *   this tier, and it is what the composer resolves `BLOCKS` against, so
 *   deploying a block the player never mined is impossible by construction
 *   rather than by a check somewhere.
 */

import type { Block } from '../shared/contracts.ts'
import type { FeedLine } from '../shared/view-driver.ts'
import type { MutableBlockStore, ReportSentences } from './ports.ts'

export function createBlockStore(): MutableBlockStore {
  const seen = new Map<string, string>()
  const mined = new Map<string, Block>()

  return {
    absorbLine(line: FeedLine): void {
      if (line.sentence_id === undefined) return
      seen.set(line.sentence_id, line.text)
    },

    absorbSentences(report: ReportSentences): void {
      for (const sentence of [...report.facts, ...report.report_body]) {
        seen.set(sentence.id, sentence.text)
      }
    },

    mine(id: string): boolean {
      const text = seen.get(id)
      if (text === undefined) return false
      mined.set(id, { id, text })
      return true
    },

    has(id: string): boolean {
      return mined.has(id)
    },

    get(id: string): Block | undefined {
      const held = mined.get(id)
      // A fresh literal: a caller mutating the resolved block cannot reach the
      // store, so two composes of the same id are byte-identical.
      return held === undefined ? undefined : { id: held.id, text: held.text }
    },
  }
}
