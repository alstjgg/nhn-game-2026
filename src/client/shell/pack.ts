// The scenario pack fetch — step 1 of the boot order (spec-client §5.1).
//
// The shell reads exactly one file, `meta.json`, and exactly three fields out
// of it: the case slug the chrome names, and the two stamps the clock runs
// between. Everything else in the pack belongs to the engine, not to the view.
//
// The pack is authored data (frozen this run), so it is parsed defensively:
// the terminal stamp is written `21:04+` there — the trailing `+` marks an
// open-ended close, and the seam's `"HH:MM"` contract has no room for it.

/** The case identity + clock band the chrome renders. */
export interface ScenarioIdentity {
  slug: string
  /** `"HH:MM"` the scenario opens on. */
  start: string
  /** `"HH:MM"` the scenario closes on. */
  end: string
}

// The shipped scenario. Switching it is a one-line change here plus the
// `<title>` in `index.html`, and nothing else: `packSlugs()` in
// `vite.config.ts` publishes every pack under `data/scenario/`, the engine
// reads whatever `meta.json` this points at, and `metaKey(packSlug)` keys the
// saved meta-state per slug, so a switch starts a clean shelf rather than
// resuming another scenario's counters.
//
// The clock band is same-day only (`driver/clock.ts` `createClock` ends the
// run on `minute >= endMinute`), which is why `compile-datapack.mjs` refuses a
// timeline that would cross midnight — a pack that did would boot already
// ended. A candidate pack has to close before 23:59.
//
// EXPORTED so a test can ask "which pack ships?" instead of restating the
// answer. `tests/driver/shipped-pack.test.ts` plays whatever this names and
// derives every expectation from that pack's own files, so switching the slug
// moves the coverage with it rather than leaving it aimed at a pack the deploy
// no longer carries.
export const PACK_SLUG = '멈춘회전문'

/**
 * The same case, spelled for a reader instead of for a filesystem.
 *
 * x2 (08-08) — the chrome was printing `PACK_SLUG` straight into `#caseName`,
 * so the desk named its own case 전구간정상: one run-on word, which is what a
 * directory name has to be and not what a control room writes. That pack's own
 * logline already spelled it 전 구간 정상 in prose, so the display name was the
 * pack agreeing with itself rather than a new name.
 *
 * 멈춘회전문 (08-10) does not name itself in its logline, so the spacing here is
 * the only place the two words come apart. 멈춘 · 회전문 is the segmentation any
 * reader makes and none of this code could — which is the same reason the field
 * is authored rather than derived.
 *
 * DELIBERATELY not derived from `PACK_SLUG` — there is no rule that puts the
 * spaces back (전/구간/정상 is not a segmentation any code here could know), and
 * a display name is authored text either way.
 *
 * The slug stays the slug everywhere it is an IDENTIFIER: the `data/scenario/`
 * path, `metaKey()`'s storage key, and the `ERR-2/AF/…` · `ERR-2/TL/…` document
 * numbers, which are catalogue numbers a reader is meant to quote back, not
 * prose. Only the places that read as a name take this.
 */
export const PACK_DISPLAY_NAME = '멈춘 회전문'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** `"21:04+"` → `"21:04"`; anything that is not a stamp is a hard failure. */
function stamp(value: unknown, field: string): string {
  if (typeof value === 'string') {
    const match = /^(\d{1,2}:\d{2})\+?$/.exec(value.trim())
    if (match) return match[1].padStart(5, '0')
  }
  throw new Error(`scenario pack: meta.json '${field}' is not an "HH:MM" stamp`)
}

function readIdentity(raw: unknown, fallbackSlug: string): ScenarioIdentity {
  if (!isRecord(raw) || !isRecord(raw.clock)) {
    throw new Error('scenario pack: meta.json has no clock band')
  }
  const slug = typeof raw.slug === 'string' && raw.slug.length > 0 ? raw.slug : fallbackSlug
  return {
    slug,
    start: stamp(raw.clock.start, 'clock.start'),
    end: stamp(raw.clock.end, 'clock.end'),
  }
}

/** Fetches `data/scenario/<slug>/meta.json` relative to the deployed base. */
export async function fetchScenarioIdentity(slug: string = PACK_SLUG): Promise<ScenarioIdentity> {
  const url = new URL(`data/scenario/${slug}/meta.json`, document.baseURI)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`scenario pack: ${url.pathname} answered ${response.status}`)
  }
  const raw: unknown = await response.json()
  return readIdentity(raw, slug)
}
