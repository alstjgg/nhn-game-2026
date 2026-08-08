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
export const PACK_SLUG = '전구간정상'

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
