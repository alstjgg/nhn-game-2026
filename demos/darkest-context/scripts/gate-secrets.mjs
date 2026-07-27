#!/usr/bin/env node
// GATE (PRD §4-2, INV-2): no provider secret may reach the deployed build.
// Usage: node scripts/gate-secrets.mjs [dir]   (dir defaults to the demo's dist/)
//
// Vacuous today — the stub build calls no provider at all — but wired now so the
// unit that adds the dev-proxy cannot ship a key by accident. Fails closed: a
// missing target dir is a failure, because a gate that cannot look is not a gate.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DIR = 'dist';
const TOKENS = ['ANTHROPIC', 'OPENAI'];

const demoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(demoRoot, process.argv[2] ?? DEFAULT_DIR);

function fail(message) {
  console.error(`gate-secrets: ${message}`);
  process.exit(1);
}

let stats;
try {
  stats = statSync(target);
} catch {
  fail(`target dir not found: ${target} — build before running the gate`);
}
if (!stats.isDirectory()) {
  fail(`target is not a directory: ${target}`);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

const hits = [];
let scanned = 0;

for (const file of walk(target)) {
  scanned += 1;
  // latin1 keeps byte-for-byte fidelity, so binary assets are scanned too
  // without a decoder throwing or silently mangling an ASCII token.
  const text = readFileSync(file, 'latin1');
  for (const token of TOKENS) {
    if (text.includes(token)) hits.push({ file: relative(target, file), token });
  }
}

if (hits.length > 0) {
  for (const { file, token } of hits) {
    console.error(`gate-secrets: FOUND "${token}" in ${file}`);
  }
  fail(`${hits.length} provider token hit(s) in ${target}`);
}

console.log(`gate-secrets: OK — ${scanned} file(s) scanned in ${target}, no provider tokens.`);
