// Assembles demos/darkest-context/DISCOVERY.md out of every discovery/*.md fragment.
//
// Units run in parallel and each writes its own fragment; the shipped log is one file a
// reviewer reads top to bottom (PRD §7). Concatenation — not an index of links — is the
// point: the fragments ARE the findings, and a list of filenames is not a deliverable.
//
// Run: node scripts/assemble-discovery.mjs
// The preamble below is the only hand-written part; everything after it is verbatim
// fragment text, in unit order.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const demo = resolve(here, '..');
const fragmentDir = join(demo, 'discovery');
const out = join(demo, 'DISCOVERY.md');

const ids = readdirSync(fragmentDir)
  .filter((name) => /^u\d+\.md$/.test(name))
  .map((name) => name.replace(/\.md$/, ''))
  .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

const PREAMBLE = `# DARKEST CONTEXT — DISCOVERY

Everything the build learned that the diff does not say. Assembled by
\`scripts/assemble-discovery.mjs\` from every fragment in \`discovery/\`; edit a fragment
and re-run, never edit this file by hand.

Fragments, in unit order: ${ids.join(' · ')}.

### 게이지 100에 갇힌 유닛 — the spectating observation (PRD §7)

The one finding that comes from *watching* the demo rather than from building it: play T1
normally, with no cards, and one hero — 가렛, because nobody is hurt on the opening turn and
the \`index\` tie-break hands the 스팸 골렘 the first hero in \`heroes.json\` — ends the very
first fight at gauge 80. He never comes back. A gauge only ever rises; the 휴식 tile is the
single relief in the run, and 생각정리's trim does not clear a reading that the next fight's
opening turn re-fills in one go.

Watching the rest of the run with that in mind is the whole pitch of the demo, and it is
also its sharpest design problem. Above 70 the judgment input is poisoned and the situation
bucket is \`gauge_noise\` **before** anything about HP or allies is considered, so a unit
parked up there can no longer show any of its authored card flips — the lookup is keyed on
a bucket the card was never written for. At 100 the overload state skips the judgment
outright and forces the 직업 기본 행동, so what a judge sees for the remaining two fights is
one hero repeating a canned line while the other two play the actual game.

That is dramatic exactly once. It is why 「원한」 could not fire on the scripted run until the
run started spending the 정리 at 휴식 (the 휴식 screen's other option, which zeroes every
reading at the cost of the oldest Prompt card), and it is the first thing a balance pass
should look at: the interesting knob is not where the tiers sit, it is that \`gauge_noise\`
outranks every situational bucket. See \`discovery/u17.md\` §3 for the arithmetic and
\`discovery/u9.md\` for the accrual rules themselves.

`;

const body = ids
  .map((id) => {
    const text = readFileSync(join(fragmentDir, `${id}.md`), 'utf8').trimEnd();
    return `---\n\n<!-- discovery/${id}.md -->\n\n${text}\n`;
  })
  .join('\n');

writeFileSync(out, `${PREAMBLE}${body}`, 'utf8');
process.stdout.write(`DISCOVERY.md ← ${ids.length} fragments (${ids.join(', ')})\n`);
