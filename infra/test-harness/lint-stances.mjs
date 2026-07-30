#!/usr/bin/env node
// Stance-set lint (run log A12). Paper check, zero calls.
//
//   node lint-stances.mjs <suite.json>
//
// A stance label that reuses the fixture temperament's vocabulary turns the probe
// into a possible string match: block trips the clause, the clause's own words
// name a stance, the model picks that stance. Law #1's vocabulary alignment on
// the output side. This flags the overlap; a human decides what is unavoidable.
//
// Flags, never blocks — 사람 or 말 may be impossible to avoid, and only the
// author knows whether an overlap is load-bearing.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const suitePath = process.argv[2];
if (!suitePath) {
  console.error('usage: node lint-stances.mjs <suite.json>');
  process.exit(1);
}

const suite = JSON.parse(readFileSync(resolve(suitePath), 'utf8'));
const stances = suite.slots?.STANCE_SET ?? [];
if (!stances.length) {
  console.error('suite has no slots.STANCE_SET');
  process.exit(1);
}

const tempPath = join(HERE, 'templates', suite.call_type ?? 'judgment', 'temperament', `${suite.temperament}.md`);
const temperament = readFileSync(tempPath, 'utf8');

// Hangul runs of 2+ syllables. Particles ride along on Korean tokens, so compare
// on containment rather than equality and accept the noise — a lint that flags
// too much is fixable by a human, one that flags too little is not.
const tokens = [...new Set((temperament.match(/[가-힣]{2,}/g) ?? []))];

// Grammatical filler and words too common to carry an axis.
const STOP = new Set([
  '있다', '없다', '한다', '이다', '너의', '그것', '이것', '하나', '먼저', '지금',
  '자신을', '보일', '어느', '쪽인지', '네가', '보고', '들은', '것으로만', '대상이',
  '아니다', '같은', '정한', '마주한', '그때는', '만든다', '너는', '이것은',
  '아니라', '위해', '대해', '통해', '보다', '먼저는',
]);

const flags = [];
for (const s of stances) {
  const hits = tokens.filter((t) => !STOP.has(t) && t.length >= 2 && s.label.includes(t));
  if (hits.length) flags.push({ id: s.id, label: s.label, hits });
}

console.log(`suite       ${suite.experiment}`);
console.log(`temperament ${suite.temperament}  (${tempPath.replace(`${HERE}/`, '')})`);
console.log(`stances     ${stances.length}\n`);

if (!flags.length) {
  console.log('✓ A12 lint clean — no stance label reuses the temperament\'s vocabulary.');
} else {
  console.log('⚠ A12 lint — stance labels reusing temperament vocabulary:\n');
  for (const f of flags) {
    console.log(`  ${f.id}) ${f.label}`);
    console.log(`     reuses: ${f.hits.join(' · ')}\n`);
  }
  console.log('Decide per overlap. A common noun may be unavoidable; a word that names');
  console.log('the clause\'s condition or its prescribed behaviour is not — reword it, or');
  console.log('the probe cannot distinguish judgment from string matching.');
}

// The other half of A12: the readings must have somewhere different to land.
console.log('\nNot checked here, and the part that actually decided S1: whether the two');
console.log('competing readings have DIFFERENT stances available. A stance both readings');
console.log('would pick is an escape option and hides the mechanism (plan §5.1 axis 4).');
