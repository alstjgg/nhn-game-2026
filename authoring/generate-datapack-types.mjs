#!/usr/bin/env node
// generate-datapack-types.mjs — `data/scenario/_schema/*.schema.json` → `src/shared/datapack.ts`
//
// The schemas are normative (pipeline §3, physical §3.1); datapack.ts is their
// transcription. Hand-keeping a transcription drifts silently — physical §3.1
// names that gap and puts it on the data track. This script closes it the
// structural way: the transcription is *generated*, so it cannot disagree.
//
//   node authoring/generate-datapack-types.mjs          # write
//   node authoring/generate-datapack-types.mjs --check  # exit 1 on drift
//
// Zero deps, deterministic output (schema files are the only input). Covers
// the schema subset the packs actually use — same subset lint-datapack.mjs
// validates: type/enum/$ref/anyOf/properties/required/additionalProperties/
// items. Constraints TS cannot express (patterns, minItems, non-zero) stay in
// the schemas and in lint; this file carries structure only.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = join(ROOT, 'data', 'scenario', '_schema');
const OUT = join(ROOT, 'src', 'shared', 'datapack.ts');

// pack file order = pipeline §3 table order
const FILES = ['meta', 'timeline', 'characters', 'places', 'temperament', 'gates', 'truths', 'score', 'symptoms'];
const typeName = (f) => f[0].toUpperCase() + f.slice(1);

const indent = (s) => s.replace(/^/gm, '  ');
const doc = (schema, pad) => {
  const d = (schema.description ?? '').replace(/\s+/g, ' ').trim();
  return d ? `${pad}/** ${d} */\n` : '';
};

function ts(schema, root) {
  if (schema.$ref) return ts(root.$defs[schema.$ref.replace('#/$defs/', '')], root);
  if (schema.anyOf) return schema.anyOf.map((b) => ts(b, root)).join(' | ');
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(' | ');

  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const parts = types.map((t) => {
    if (t === 'null') return 'null';
    if (t === 'string') return 'string';
    if (t === 'number' || t === 'integer') return 'number';
    if (t === 'boolean') return 'boolean';
    if (t === 'array') return schema.items ? `Array<${ts(schema.items, root)}>` : 'unknown[]';
    if (t === 'object') return objectTs(schema, root);
    return 'unknown';
  });
  return [...new Set(parts)].join(' | ');
}

function objectTs(schema, root) {
  const props = schema.properties ?? null;
  const ap = schema.additionalProperties;
  const mapPart = ap && typeof ap === 'object' ? `Record<string, ${ts(ap, root)}>` : null;

  if (!props) return mapPart ?? 'Record<string, unknown>';

  const required = new Set(schema.required ?? []);
  const fields = Object.entries(props).map(([k, v]) => {
    const key = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
    return `${doc(v, '')}${key}${required.has(k) ? '' : '?'}: ${ts(v, root)};`;
  });
  const literal = `{\n${indent(fields.join('\n'))}\n}`;
  return mapPart ? `(${literal} & ${mapPart})` : literal;
}

let out = `/**
 * Datapack types — the shape of one scenario's contents.
 *
 * ⚠ GENERATED FILE — do not edit by hand.
 * Source: \`data/scenario/_schema/*.schema.json\` (normative — pipeline §3,
 * physical §3.1). Regenerate with
 * \`node authoring/generate-datapack-types.mjs\`;
 * \`--check\` fails on drift. If this file and the schemas disagree, this
 * file is stale — never the other way around.
 *
 * Constraints TS cannot express (patterns, minItems, non-zero deltas) live in
 * the schemas and in lint-datapack.mjs; this file carries structure only. The
 * engine never reads a file — datapacks arrive already parsed (physical
 * §3.2), so nothing here may import \`fs\` or \`fetch\`.
 */

`;

for (const name of FILES) {
  const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, `${name}.schema.json`), 'utf8'));
  out += doc({ description: schema.title }, '');
  out += `export type ${typeName(name)} = ${ts(schema, schema)};\n\n`;
}

out += `/** One scenario's full pack — \`data/scenario/<slug>/\`, keyed by file. */
export type Datapack = {
${FILES.map((f) => `  ${f}: ${typeName(f)};`).join('\n')}
};
`;

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(OUT, 'utf8'); } catch { /* missing = drift */ }
  if (current !== out) {
    console.error('✗ src/shared/datapack.ts is stale — regenerate: node authoring/generate-datapack-types.mjs');
    process.exit(1);
  }
  console.log('✓ datapack.ts matches _schema/');
} else {
  writeFileSync(OUT, out);
  console.log(`✓ wrote ${OUT}`);
}
