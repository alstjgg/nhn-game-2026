#!/usr/bin/env node
// prompts/**/*.md  →  src/prompt-bundle.generated.ts
//
//   node scripts/generate-prompt-bundle.mjs           # write
//   node scripts/generate-prompt-bundle.mjs --check   # exit 1 on drift
//
// WHY A GENERATOR AND NOT A FILE READ. SAM builds this function with esbuild,
// which bundles the entry point's *module graph* — the .md files are not in it,
// so a `readFileSync('prompts/…')` that works locally returns ENOENT inside the
// Lambda zip. Inlining them at build time also keeps the handler free of
// filesystem access entirely, which is the same property the engine has for the
// same reason (physical architecture §3.2).
//
// The .md files stay the source of truth: they are what an author edits and what
// `tools/probe` reads directly. This file is a transcription with a drift gate,
// exactly like `src/shared/datapack.ts` (physical §3.1) — `--check` runs inside
// `npm run check`, so a prompt edit without a regenerate fails before deploy.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PROMPTS = join(ROOT, 'prompts');
const OUT = join(ROOT, 'src', 'prompt-bundle.generated.ts');

const check = process.argv.includes('--check');

/** `<call>/<layer>-<version>` → text. One flat key space; the loader parses it. */
function collect() {
  const entries = [];
  for (const call of readdirSync(PROMPTS).sort()) {
    const dir = join(PROMPTS, call);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir).sort()) {
      const m = /^(base|user)-(v[0-9]+\.[0-9]+)\.md$/.exec(file);
      if (!m) continue;
      entries.push({
        key: `${call}/${m[1]}-${m[2]}`,
        text: readFileSync(join(dir, file), 'utf8'),
      });
    }
  }
  if (!entries.length) throw new Error(`no prompt files found under ${PROMPTS}`);
  return entries;
}

function render(entries) {
  const body = entries
    .map(({ key, text }) => `  ${JSON.stringify(key)}: ${JSON.stringify(text)},`)
    .join('\n');
  return `/**
 * ⚠ GENERATED FILE — do not edit by hand.
 * Source: the .md files under \`proxy/prompts/\` (normative).
 * Regenerate with \`npm run prompts:bundle\`; \`--check\` fails on drift and runs
 * inside \`npm run check\`. If this file and the .md files disagree, this file is
 * stale — never the other way around.
 *
 * Inlined rather than read at runtime because esbuild bundles the module graph,
 * not the prompts directory. See scripts/generate-prompt-bundle.mjs.
 */

export const PROMPT_BUNDLE: Readonly<Record<string, string>> = Object.freeze({
${body}
});
`;
}

const next = render(collect());

if (check) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    /* missing counts as drift */
  }
  if (current !== next) {
    console.error(
      '✗ src/prompt-bundle.generated.ts is stale — regenerate: npm run prompts:bundle',
    );
    process.exit(1);
  }
  console.log('✓ prompt bundle matches prompts/');
} else {
  writeFileSync(OUT, next);
  console.log(`✓ wrote ${OUT}`);
}
