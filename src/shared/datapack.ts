/**
 * Datapack types — the shape of one scenario's contents.
 *
 * Owner: 민서 (data track), per physical architecture §3.1. Left as a stub
 * deliberately: the field-level type definitions are the data track's own
 * deliverable, scheduled as the next revision of pipeline §3 and written
 * together with the compile skill.
 *
 * What lands here: the types for `data/scenario/<slug>/` — `meta.json` ·
 * `timeline.json` · `characters.json` · `places.json` · `temperament.json` ·
 * `gates.json` · `truths.json` · `score.json` · `symptoms.json`.
 *
 * **This file is a transcription; `data/scenario/_schema/*.schema.json` is
 * normative** (pipeline §3, physical §3.1). Not because a document outranks
 * code, but because a TS type is erased at runtime — it describes JSON and
 * cannot check it, and packs must be validated by compile and lint in
 * `tools/`, where no engine and no TS build exist yet. Rules like "≥2 key
 * examples per condition" have no TS expression at all. If this file and the
 * schemas disagree, this file is the bug.
 *
 * The engine never reads a file — datapacks arrive already parsed (§3.2), so
 * nothing in this module may import `fs` or `fetch`.
 */

export {}
