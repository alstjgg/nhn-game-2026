/**
 * Sentence identity — the single minting site (contract-engine-composer §2.0,
 * spec-client §5.2 "sentence identity is engine-minted").
 *
 * Grammar: `b-r<run>-<channel><nn>`, over the five minted channels declared by
 * `species.ts`'s `SPECIES_OF` (`f · b · n · q · u`). `<nn>` is a *minimum*
 * width of two digits, zero-padded, 1-based — not a cap, so a 100th sentence
 * mints `b-r1-f100` rather than colliding with a truncated `b-r1-f10`.
 *
 * `t*` ids (`timeline.json`'s authored script events) are a **separate**
 * family: run-independent, never minted, recognised rather than parsed for a
 * run/channel/index they do not carry.
 *
 * The channel set and the channel→species map are consumed from `species.ts`
 * — frozen, never re-declared here.
 */
import { SPECIES_OF, AUTHORED_SPECIES } from './species.ts'
import type { Channel, Species } from './species.ts'

/** The channel character class, derived from `SPECIES_OF`'s own keys. */
const CHANNEL_CLASS = Object.keys(SPECIES_OF).join('')

/**
 * Matches a minted id and nothing else. Stateless — no `/g`/`/y`, so repeated
 * `.test()` calls do not alternate on `lastIndex`.
 */
export const ID_PATTERN: RegExp = new RegExp(`^b-r(\\d+)-([${CHANNEL_CLASS}])(\\d{2,})$`)

/** `t<n>` — an authored script event id. Also stateless. */
const AUTHORED_PATTERN = /^t([0-9]+)$/

export type ParsedSentenceId = {
  run: number
  channel: Channel
  index: number
  species: Species
}

function isChannel(value: string): value is Channel {
  return Object.prototype.hasOwnProperty.call(SPECIES_OF, value)
}

/** Mints `b-r<run>-<channel><nn>`. Throws on anything off the grammar. */
export function mintSentenceId(run: number, channel: Channel, index: number): string {
  if (!isChannel(channel)) {
    throw new Error(
      `mintSentenceId: channel must be one of SPECIES_OF's keys, got ${JSON.stringify(channel)}`,
    )
  }
  if (!Number.isInteger(run) || run <= 0) {
    throw new Error(`mintSentenceId: run must be a positive integer, got ${run}`)
  }
  if (!Number.isInteger(index) || index <= 0) {
    throw new Error(`mintSentenceId: index must be a positive integer (ids are 1-based), got ${index}`)
  }
  return `b-r${run}-${channel}${String(index).padStart(2, '0')}`
}

/** Total on any input — `null` rather than throwing on anything malformed or authored. */
export function tryParseSentenceId(id: string): ParsedSentenceId | null {
  const m = ID_PATTERN.exec(id)
  if (!m) return null
  const channel = m[2] as Channel
  return {
    run: Number(m[1]),
    channel,
    index: Number(m[3]),
    species: SPECIES_OF[channel],
  }
}

/** Throws, naming the offending id, when `id` is not a minted sentence id. */
export function parseSentenceId(id: string): ParsedSentenceId {
  const parsed = tryParseSentenceId(id)
  if (!parsed) {
    throw new Error(`parseSentenceId: not a minted sentence id: ${JSON.stringify(id)}`)
  }
  return parsed
}

export function isMintedSentenceId(id: string): boolean {
  return ID_PATTERN.test(id)
}

/** Recognises `timeline.json`'s `t<n>` shape. Not a minted id — no run, no channel. */
export function isAuthoredSentenceId(id: string): boolean {
  return AUTHORED_PATTERN.test(id)
}

/** `사실` for an authored id, the channel's mapped species for a minted one. Throws otherwise. */
export function speciesOfSentenceId(id: string): Species {
  if (isAuthoredSentenceId(id)) return AUTHORED_SPECIES
  const parsed = tryParseSentenceId(id)
  if (parsed) return parsed.species
  throw new Error(
    `speciesOfSentenceId: id belongs to neither the minted nor authored family: ${JSON.stringify(id)}`,
  )
}
