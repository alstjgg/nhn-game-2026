// Schema conformance, delegated.
//
// decision 1 named a hand-rolled validator "in drive-run.mjs", with a standing
// preference: if an equivalent walker is already merged, import it rather than
// write a second one. e8 wrote that walker, so this file is the delegation and
// nothing else. The walker reports any keyword it does not implement, which is
// what stops a green `--validate` from being vacuous.
//
// That import used to reach into `tests/runloop/schema.ts`, which meant this
// shipped CLI did not carry its own validator: a tree of `src` + `tools` +
// `data` could not run it (review finding E). The walker now lives beside this
// file and is still the only copy — `tests/runloop/schema.ts` re-exports it.

import { join } from 'node:path'
import { loadSchema, validate } from './schema.ts'
import { REPO } from './pack.mjs'

export const RUN_RECORD_SCHEMA_PATH = join(REPO, 'data/runs/_schema/run-record.schema.json')
export const META_STATE_SCHEMA_PATH = join(REPO, 'data/runs/_schema/meta-state.schema.json')

const runSchema = loadSchema(RUN_RECORD_SCHEMA_PATH)
const metaSchema = loadSchema(META_STATE_SCHEMA_PATH)

/** `{ errors, unimplemented }` — both must be empty for the record to conform. */
export function validateRunRecord(value) {
  return validate(runSchema, value)
}

export function validateMetaState(value) {
  return validate(metaSchema, value)
}

/** Every complaint, one per line, for the CLI's failure channel. */
export function formatValidation(result) {
  return [
    ...result.errors.map((error) => `  error: ${error}`),
    ...result.unimplemented.map((gap) => `  unimplemented: ${gap}`),
  ].join('\n')
}
