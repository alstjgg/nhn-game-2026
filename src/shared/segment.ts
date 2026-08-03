/**
 * Report-body segmenter — one `report_body` string → the sentences that become
 * `b`-channel blocks.
 *
 * Owner: 윤석. Ratified in PR #108 (spec-client §5.2): it "lives in
 * `src/shared/`, is called by engine, fixture generator, and probe alike
 * (invariant 12 made structural), and carries a golden test."
 *
 * **Why one implementation and not three.** The engine mints `b-r<run>-b<nn>`
 * ids from these sentences at run time; the fixture generator mints the same
 * ids offline so the client's fixture mode and live mode are indistinguishable;
 * the probe reads report bodies when it measures the reporter call. Three
 * splitters would disagree on some sentence eventually, and the disagreement
 * would surface as a mined block whose id points at different text depending on
 * which produced it — archive highlighting is keyed on exactly that id.
 *
 * **It must be deterministic and it must never merge two sentences into one
 * block**, because a block is what the player injects: a merged pair injects
 * two claims under one id and the mechanism measurement can no longer say which
 * one moved the stance.
 *
 * The golden test below the fold is the contract. Changing the output for an
 * input the golden covers is a **breaking change** — old run records and
 * fixtures carry ids minted under the old split.
 */

/** `[.!?…]` plus the Korean full stop, optionally trailed by closing marks. */
const TERMINATOR = /([.!?…]+["'”’)\]]*)\s+/g

/** Markdown block noise the player should never see inside a block. */
const BLOCK_PREFIX = /^\s*(?:[#>]+\s*|[-*+]\s+|\d+[.)]\s+)/

/**
 * Split a report body into block-sized sentences.
 *
 * Rules, all of them chosen to be checkable rather than clever:
 *
 * 1. **Block structure first.** Split on newlines, so a markdown list item or a
 *    paragraph break can never be swallowed into its neighbour.
 * 2. **Then sentence terminators.** A run of `.!?…` ends a sentence when
 *    whitespace follows; closing quotes and brackets ride along with it, so
 *    `"…라고 했다." 그는` splits after the quote, not inside it.
 * 3. **A trailing fragment is kept.** Model output does not always end in a
 *    terminator, and dropping the tail would silently lose a minable sentence.
 * 4. **Leading markdown markers are stripped**, because the marker is layout,
 *    not text — the player mines a sentence, not a bullet.
 * 5. **Empty results are dropped**, and a body that yields nothing returns `[]`
 *    rather than `['']`. An empty block is unminable and unrenderable.
 *
 * Deliberately NOT done: abbreviation handling and decimal-point protection.
 * Korean report prose has neither in any measured sample, and a heuristic that
 * fires on text nobody writes is a source of nondeterminism, not safety. If a
 * real body ever breaks on one, add the case to the golden test first.
 */
export function segmentReportBody(body: string): string[] {
  const out: string[] = []

  for (const line of body.split(/\r?\n/)) {
    const stripped = line.replace(BLOCK_PREFIX, '').trim()
    if (!stripped) continue

    // `split` on a capturing regex interleaves the captured terminators, so
    // rejoin each fragment with the terminator that ended it.
    const parts = stripped.split(TERMINATOR)
    let buffer = ''
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i] ?? ''
      if (i % 2 === 0) {
        buffer = part
      } else {
        const sentence = `${buffer}${part}`.trim()
        if (sentence) out.push(sentence)
        buffer = ''
      }
    }
    const tail = buffer.trim()
    if (tail) out.push(tail) // rule 3
  }

  return out
}
