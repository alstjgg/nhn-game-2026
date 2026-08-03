/**
 * Channel → `Species`. The map spec-client §5.2 ratified as existing but never
 * wrote down.
 *
 * Owner: 윤석 (architecture track). Pure data — physical §3.2 permits that here.
 *
 * "**Species derives from the channel, never from classification**" is the
 * ratified rule (spec-client §5.2). Nothing infers a species from the text: a
 * sentence is what its source made it.
 *
 * The four names are the authoring vocabulary, not new terms —
 * `사실` · `자기서술` · `감정` · `인용` from the scenario guide. Two of them are
 * **certified** and two are not, and that split is load-bearing rather than
 * descriptive:
 *
 * - [contract-datapack](../../docs/contract-datapack.md) **E2** — a key
 *   condition's species is `사실` or `자기서술` **only** (schema enum);
 *   emotion and quotation cannot enter the solution path.
 * - [gate-hardening-manual](../../docs/scenario/gate-hardening-manual.md)
 *   anti-pattern **5** — an uncertified species on the correct path "moves even
 *   when it points at a bystander, so aiming becomes impossible". Emotion and
 *   quotation belong in the periphery, as texture.
 *
 * So this map decides which generated text can ever be part of a solution.
 */

/**
 * ⚠️ **Temporary local declaration.** `Species` is a view-driver seam type and
 * belongs in `src/shared/view-driver.ts`, which the client build's u2 creates
 * (spec-client §5.2 — "types land in `src/shared/view-driver.ts`"). That file
 * does not exist yet and is not mine to write.
 *
 * The four literals are reproduced **verbatim from the ratified seam**. The
 * moment `view-driver.ts` lands, delete this and
 * `import type { Species } from './view-driver.ts'` — a duplicated union is a
 * drift risk, and this one is tolerated only because the alternative is
 * blocking u2 on a file u2 itself has not written.
 */
export type Species = 'fact' | 'selfnarr' | 'emotion' | 'quote'

/**
 * The five minted channels. `t*` ids are inherited from `timeline.json` and
 * never minted (contract-engine-composer §2.0), so they are not in this union —
 * see `AUTHORED_SPECIES` below.
 */
export type Channel = 'f' | 'b' | 'n' | 'q' | 'u'

export const SPECIES_OF: Readonly<Record<Channel, Species>> = {
  /**
   * Call 3 `facts` — the objective log. `contract-datapack` W3 derives species
   * from where a sentence was mined: **objective log → 사실**. Certified.
   */
  f: 'fact',
  /**
   * Call 3 `report_body` — the subjective report. W3: **subjective report →
   * 자기서술**. Certified, and *exclusively* so: report-guidance states the key
   * condition's 자기서술 species "comes only from here", which is what makes W1
   * pay off in the next round's blocks.
   */
  b: 'selfnarr',
  /**
   * Call 2 `timeline_entries` — "reactions and scene texture" (call contracts
   * §2). Uncertified, deliberately.
   *
   * This is the one the ratification left unstated, and it is not a matter of
   * taste. Certifying it would put **model-generated, unauthored prose on the
   * solution path** — anti-pattern 5 exactly. `fact` is reserved for the
   * objective log and for authored script events; scene texture is neither.
   */
  n: 'emotion',
  /** Call 2 `npc_lines` — dialogue. Quoted speech, uncertified. */
  q: 'quote',
  /** Call 1 `utterance` — the controller's own line. Also quoted speech. */
  u: 'quote',
} as const

/**
 * Authored script events (`timeline.json`, `t*` ids) are the objective record of
 * what happened, and they are authored rather than generated — so `사실`.
 */
export const AUTHORED_SPECIES: Species = 'fact'

/** The two species a key condition may be (contract-datapack E2). */
export const CERTIFIED: ReadonlySet<Species> = new Set<Species>(['fact', 'selfnarr'])

export const isCertified = (s: Species): boolean => CERTIFIED.has(s)
