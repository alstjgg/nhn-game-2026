// The browser twin of `tools/driver/run/pack.mjs`.
//
// e9 reads the pack off disk with `node:fs`; the deployed client cannot, so the
// same six files are fetched instead. Nothing here interprets the pack — it
// parses the JSON the engine already declares types for and hands it on, so the
// two loaders can only disagree about *transport*, never about content.
//
// `baseUrl` is injected rather than read off the page: every module under
// `src/client/driver/` is held free of DOM globals by
// `tests/driver/import-direction.test.ts (j)`, and the shell already knows the
// deployed base. Same reason `fetch` arrives as an argument.
//
// Physical §3.7 is what makes this reachable at all: `vite.config.ts`'s
// `copyPackData()` copies `data/scenario` and `data/policy` into `dist/`, by
// name, so the pack ships with the bundle.

import type { EnginePack } from '../../../engine/index.ts'

/**
 * The six files the run reads. `places` / `truths` / `score` / `draft` are
 * authoring surfaces no seam on this path consumes — fetching them would invent
 * a dependency and cost four requests on the judge's first load.
 */
const PACK_FILES = [
  'meta',
  'timeline',
  'gates',
  'characters',
  'temperament',
  'symptoms',
] as const

/** The pack plus the slug it declares — what `bindLiveRun` needs to open a run. */
export type LivePack = EnginePack & { slug: string }

/**
 * Only what a GET of a JSON file needs. Deliberately NOT the transport's
 * `FetchLike`: that one is shaped for the proxy POST and requires a body, and a
 * GET carrying one is a runtime error in every browser.
 */
export type PackFetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

export type PackSource = {
  /** The deployed base, resolved by the shell and injected here. */
  baseUrl: string
  fetch: PackFetch
}

async function readJson(source: PackSource, path: string): Promise<unknown> {
  const url = new URL(path, source.baseUrl).toString()
  const response = await source.fetch(url)
  if (!response.ok) {
    throw new Error(`pack fetch: ${path} answered ${response.status}`)
  }
  return response.json()
}

/**
 * Fetches one scenario pack. Throws — naming the file — when a part is absent
 * or unparseable, so a bad deploy fails at boot rather than at the first gate.
 *
 * The six requests go out together: they are independent, they are all small,
 * and serialising them would put six round-trips in front of the judge's first
 * frame for no reason.
 */
export async function fetchPack(source: PackSource, slug: string): Promise<LivePack> {
  const parts = await Promise.all(
    PACK_FILES.map(async (name) => {
      const value = await readJson(source, `data/scenario/${slug}/${name}.json`)
      return [name, value] as const
    }),
  )
  const pack = Object.fromEntries(parts) as Record<(typeof PACK_FILES)[number], unknown>

  // The same guard e9 applies: a pack whose meta disagrees with the directory
  // it was fetched from is not the pack the caller asked for.
  const meta = pack.meta as { slug?: unknown }
  if (meta.slug !== slug) {
    throw new Error(`pack "${slug}": meta.json declares slug ${JSON.stringify(meta.slug)}`)
  }

  return {
    slug,
    timeline: pack.timeline,
    gates: pack.gates,
    characters: pack.characters,
    temperament: pack.temperament,
    symptoms: pack.symptoms,
  } as LivePack
}

/** `data/policy/report-guidance.json` — scenario-independent, host-loaded. */
export function fetchGuidance(source: PackSource): Promise<unknown> {
  return readJson(source, 'data/policy/report-guidance.json')
}
