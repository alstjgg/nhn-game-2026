// [e8] Generic JSON-Schema walker — the D5/A7/A8 conformance instrument.
//
// PRD §4: "validate against the schemas; do not hand-roll a shape". No `ajv` in
// the repo and none may be added, so this walks the on-disk `.schema.json`
// itself. It implements exactly the keyword subset the run-artifact schemas use
// and reports anything else as *unimplemented* rather than silently passing —
// a walker that ignores a keyword it does not know is a vacuous walker.
//
// WHY IT LIVES HERE. It was written at `tests/runloop/schema.ts`, and then
// `tools/driver/run/validate.mjs` — a *shipped* CLI — imported it from there,
// so `cp -R src tools data <dir> && node <dir>/tools/driver/drive-run.mjs …`
// died on `ERR_MODULE_NOT_FOUND: <dir>/tests/runloop/schema.ts`: the tool did
// not carry its own validator. There is still exactly one definition site
// (decision 1's hard preference), but it is on the tool side now, and the
// import direction is tests → tools rather than the reverse.
// `tests/runloop/schema.ts` re-exports this module for e8's suites.
// `tools/lib/` would be the better home still — it is frozen for this unit.
//
// Not a `*.test.ts`: vitest's `include` is `tests/**/*.test.ts`, so this file is
// a helper module only.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repo root — `tools/driver/run/` is three levels down. */
export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
export const META_STATE_SCHEMA_PATH = path.join(REPO, 'data/runs/_schema/meta-state.schema.json')

export type JsonSchema = Record<string, unknown>

export type Validation = {
  /** Instance violations, JSON-pointer prefixed. Empty ⇔ the value conforms. */
  errors: string[]
  /** Schema keywords/type names this walker does not implement. Must be empty. */
  unimplemented: string[]
}

/**
 * Keywords that assert nothing — safe to skip.
 *
 * `$defs` is here rather than in `IMPLEMENTED`: it is a container of named
 * subschemas, and asserts nothing about the instance at the point it appears.
 * What *uses* it is `$ref`, which is enforced below.
 */
const ANNOTATIONS = new Set([
  '$schema',
  '$id',
  '$comment',
  '$defs',
  'title',
  'description',
  'examples',
  'default',
])

/** Keywords this walker actually enforces (spec D8). */
const IMPLEMENTED = new Set([
  'type',
  'required',
  'additionalProperties',
  'properties',
  'items',
  'anyOf',
  'enum',
  '$ref',
  'pattern',
  'minLength',
  'minimum',
])

const TYPE_CHECKS: Record<string, (v: unknown) => boolean> = {
  object: (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
  array: (v) => Array.isArray(v),
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  integer: (v) => typeof v === 'number' && Number.isInteger(v),
  boolean: (v) => typeof v === 'boolean',
  null: (v) => v === null,
}

export function loadSchema(file: string = META_STATE_SCHEMA_PATH): JsonSchema {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonSchema
}

/**
 * Resolves a local `#/…` JSON pointer against the document root. Only local
 * refs are supported; anything else is reported unimplemented rather than
 * silently passed over.
 */
function resolveRef(root: JsonSchema, ref: string): JsonSchema | null {
  if (!ref.startsWith('#/')) return null
  let node: unknown = root
  for (const raw of ref.slice(2).split('/')) {
    const token = raw.replace(/~1/g, '/').replace(/~0/g, '~')
    if (typeof node !== 'object' || node === null) return null
    node = (node as Record<string, unknown>)[token]
  }
  return typeof node === 'object' && node !== null ? (node as JsonSchema) : null
}

function walk(
  schema: JsonSchema,
  value: unknown,
  ptr: string,
  res: Validation,
  root: JsonSchema,
): void {
  for (const key of Object.keys(schema)) {
    if (!ANNOTATIONS.has(key) && !IMPLEMENTED.has(key)) {
      res.unimplemented.push(`${ptr}: unimplemented keyword "${key}"`)
    }
  }

  if (typeof schema.$ref === 'string') {
    const target = resolveRef(root, schema.$ref)
    if (target === null) {
      res.unimplemented.push(`${ptr}: unresolvable $ref "${schema.$ref}"`)
    } else {
      walk(target, value, ptr, res, root)
    }
  }

  const type = schema.type
  if (typeof type === 'string') {
    const check = TYPE_CHECKS[type]
    if (!check) {
      res.unimplemented.push(`${ptr}: unimplemented type "${type}"`)
    } else if (!check(value)) {
      res.errors.push(`${ptr}: expected type ${type}, got ${describe(value)}`)
      return // no point cascading into the wrong shape
    }
  } else if (Array.isArray(type)) {
    // The array form is an implicit union — "any one of these type names".
    const names = type as unknown[]
    const unknown = names.filter((n) => typeof n !== 'string' || TYPE_CHECKS[n] === undefined)
    if (unknown.length > 0) {
      res.unimplemented.push(`${ptr}: unimplemented type name(s) ${JSON.stringify(unknown)}`)
    } else if (!names.some((n) => TYPE_CHECKS[n as string]!(value))) {
      res.errors.push(`${ptr}: expected type ${names.join('|')}, got ${describe(value)}`)
      return
    }
  } else if (type !== undefined) {
    res.unimplemented.push(`${ptr}: unimplemented "type" form ${JSON.stringify(type)}`)
  }

  if (Array.isArray(schema.enum)) {
    const allowed = schema.enum as unknown[]
    if (!allowed.some((option) => JSON.stringify(option) === JSON.stringify(value))) {
      res.errors.push(`${ptr}: ${JSON.stringify(value)} is not one of ${JSON.stringify(allowed)}`)
    }
  }

  if (Array.isArray(schema.anyOf)) {
    const branches = (schema.anyOf as JsonSchema[]).map((branch, i) => {
      const sub: Validation = { errors: [], unimplemented: [] }
      walk(branch, value, `${ptr}/anyOf/${i}`, sub, root)
      return sub
    })
    for (const b of branches) res.unimplemented.push(...b.unimplemented)
    if (!branches.some((b) => b.errors.length === 0)) {
      res.errors.push(`${ptr}: matched no anyOf branch — ${branches.map((b) => b.errors.join(', ')).join(' | ')}`)
    }
  }

  if (TYPE_CHECKS.object!(value)) {
    const obj = value as Record<string, unknown>
    const props = (schema.properties ?? {}) as Record<string, JsonSchema>

    for (const key of (schema.required ?? []) as string[]) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) res.errors.push(`${ptr}: missing required "${key}"`)
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) res.errors.push(`${ptr}: additional property "${key}"`)
      }
    } else if (schema.additionalProperties !== undefined) {
      res.unimplemented.push(`${ptr}: unimplemented additionalProperties form`)
    }
    for (const [key, sub] of Object.entries(props)) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        walk(sub, obj[key], `${ptr}/${key}`, res, root)
      }
    }
  }

  if (Array.isArray(value) && schema.items !== undefined) {
    const items = schema.items as JsonSchema
    value.forEach((item, i) => walk(items, item, `${ptr}/${i}`, res, root))
  }

  if (typeof value === 'string') {
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern as string).test(value)) {
      res.errors.push(`${ptr}: "${value}" fails pattern ${schema.pattern}`)
    }
    if (typeof schema.minLength === 'number' && value.length < (schema.minLength as number)) {
      res.errors.push(`${ptr}: shorter than minLength ${schema.minLength}`)
    }
  }

  if (typeof value === 'number' && typeof schema.minimum === 'number' && value < (schema.minimum as number)) {
    res.errors.push(`${ptr}: ${value} < minimum ${schema.minimum}`)
  }
}

function describe(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

export function validate(schema: JsonSchema, value: unknown): Validation {
  const res: Validation = { errors: [], unimplemented: [] }
  walk(schema, value, '#', res, schema)
  return res
}

/** Convenience: validate against `data/runs/_schema/meta-state.schema.json`. */
export function validateMetaState(value: unknown): Validation {
  return validate(loadSchema(), value)
}
