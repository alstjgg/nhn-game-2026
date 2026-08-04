// Schema conformance, delegated.
//
// decision 1 named a hand-rolled validator "in drive-run.mjs", with a standing
// preference: if an equivalent walker is already merged, import it rather than
// write a second one. e8 merged `tests/runloop/schema.ts`, so this file is the
// delegation and nothing else. The walker reports any keyword it does not
// implement, which is what stops a green `--validate` from being vacuous.

import { join } from 'node:path'
import { loadSchema, validate } from '../../../tests/runloop/schema.ts'
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
