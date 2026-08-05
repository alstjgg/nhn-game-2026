// The fs half of drive-run — design D-6 / spec B5.
//
// `runHeadless()` is pure of fs so a test can call it directly, which means the
// reading of `data/scenario/<slug>/` and `data/policy/` has to live somewhere
// else. This is that somewhere. Nothing here interprets the pack: it parses the
// JSON the engine modules already declare types for and hands it on.

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Repo root — `tools/driver/run/` is three levels down. */
export const REPO = resolve(HERE, '..', '..', '..')

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

/**
 * The seven pack files the run actually reads. `places` / `truths` / `draft`
 * remain authoring surfaces no seam on this path consumes — loading them would
 * be inventing a dependency.
 *
 * `score` joined the list when the run record stopped writing `score: null`.
 * It was an authoring surface for exactly as long as nothing built a
 * `ScorerPort`; it is now the only input to the ledger. Kept in step with the
 * browser loader's list (`src/client/driver/live/pack.ts`) deliberately — the
 * two loaders may disagree about transport, never about content.
 */
const PACK_FILES = ['meta', 'timeline', 'gates', 'characters', 'temperament', 'symptoms', 'score']

/**
 * One parsed scenario pack. Throws — naming the file — when the pack is absent
 * or malformed, so an unknown slug fails before anything is written.
 */
export function loadPack(slug) {
  const dir = join(REPO, 'data', 'scenario', slug)
  const pack = {}
  for (const name of PACK_FILES) {
    const file = join(dir, `${name}.json`)
    try {
      pack[name] = readJson(file)
    } catch (cause) {
      throw new Error(`pack "${slug}": cannot read ${name}.json — ${cause.message}`)
    }
  }
  if (pack.meta.slug !== slug) {
    throw new Error(`pack "${slug}": meta.json declares slug "${pack.meta.slug}"`)
  }
  return {
    slug,
    timeline: pack.timeline,
    gates: pack.gates,
    characters: pack.characters,
    temperament: pack.temperament,
    symptoms: pack.symptoms,
    score: pack.score,
  }
}

/** `data/policy/report-guidance.json` — scenario-independent, host-loaded. */
export function loadGuidance() {
  return readJson(join(REPO, 'data', 'policy', 'report-guidance.json'))
}
