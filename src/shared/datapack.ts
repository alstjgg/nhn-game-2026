/**
 * Datapack types + JSON schema — the shape of one scenario's contents.
 *
 * Owner: 민서 (data track), per physical architecture §3.1. Left as a stub
 * deliberately: the field-level type definitions are the data track's own
 * deliverable, scheduled as the next revision of pipeline §3 and written
 * together with the compile skill.
 *
 * What lands here: the types for `data/scenario/<slug>/` — `meta.json` ·
 * `timeline.json` · `characters.json` · `temperament.json` · `gates.json` ·
 * `truths.json` · `score.json` (+ `symptoms.json`, requested by the engine
 * spec §6).
 *
 * **This file is normative, the document is the pointer.** Types living in both
 * a document and a compiler drift, and the drift stays silent until a datapack
 * fails to load. Pipeline §3 names the fields and says what they mean; what
 * anything is actually checked against is here.
 *
 * The engine never reads a file — datapacks arrive already parsed (§3.2), so
 * nothing in this module may import `fs` or `fetch`.
 */

export {}
