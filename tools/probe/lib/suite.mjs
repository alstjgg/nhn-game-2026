// Suite loading + validation. Validation doubles as the pre-registration gate:
// deep-test plan §9.1 requires a hypothesis, N, and a drop condition written
// before any call, so a suite missing them cannot run at all. "Written before
// data it costs nothing" only holds if something refuses to proceed without it.

import { readFileSync } from 'node:fs';
import { CALL_TYPES } from '../../lib/calls.mjs';
import { CHANNEL_SLOTS } from './armdiff.mjs';

// Aliases resolve to whatever the platform currently points at, which is how the
// prior program ended up with `"model": "haiku"` in its metrics — a record that
// cannot be reproduced or compared. Pinned ids only.
const BARE_ALIASES = new Set(['haiku', 'sonnet', 'opus', 'claude-haiku', 'claude-sonnet']);

export function loadSuite(path) {
  const suite = JSON.parse(readFileSync(path, 'utf8'));
  suite.template_version ??= 'v0.4';
  suite.max_tokens ??= 1024;
  suite.timeout_ms ??= 120_000;
  return suite;
}

export function validateSuite(suite) {
  const fatal = [];
  const warn = [];
  const need = (cond, msg) => { if (!cond) fatal.push(msg); };

  need(suite.experiment, 'missing "experiment" (used as the artifact directory name)');
  need(CALL_TYPES[suite.call_type], `unknown call_type "${suite.call_type}" — see tools/lib/calls.mjs`);
  need(CHANNEL_SLOTS[suite.channel], `unknown channel "${suite.channel}" — see CHANNEL_SLOTS`);
  need(suite.model, 'missing "model"');
  if (suite.model && BARE_ALIASES.has(suite.model)) {
    fatal.push(`model "${suite.model}" is an unpinned alias — use a dated id (e.g. claude-haiku-4-5-20251001)`);
  }

  const pre = suite.pre_registration ?? {};
  need(pre.hypothesis, 'pre_registration.hypothesis missing — must be in gate standard form (§9.1)');
  need(Number.isInteger(pre.n_per_arm) && pre.n_per_arm > 0, 'pre_registration.n_per_arm must be a positive integer');
  need(pre.drop_condition, 'pre_registration.drop_condition missing — the load-bearing field (§9.1)');

  const arms = Object.keys(suite.arms ?? {});
  need(arms.length >= 1, 'no arms defined');
  need(arms.includes('baseline'), 'no "baseline" arm — every probe needs its no-injection control (§7.3 step 2)');
  if (suite.channel !== 'SHAPE' && !arms.includes('placebo')) {
    warn.push('no "placebo" arm — §2 requires a matched control for any mechanism claim; ' +
      'acceptable only if the pre-registration sheet says why (e.g. a shape re-validation)');
  }

  if (suite.call_type === 'judgment') {
    const set = suite.slots?.STANCE_SET;
    need(Array.isArray(set) && set.length >= 2, 'slots.STANCE_SET needs >= 2 {id,label} stances');
    need(suite.slots?.GATE_QUESTION, 'slots.GATE_QUESTION missing');
    need(suite.slots?.TIMELINE_EXCERPT, 'slots.TIMELINE_EXCERPT missing');
    if (Array.isArray(set)) {
      const dupes = set.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i);
      if (dupes.length) fatal.push(`duplicate stance ids: ${dupes.join(', ')}`);
    }
  }

  if (suite.call_type === 'narration') {
    need(suite.slots?.FIXED_NPC_ACTION, 'slots.FIXED_NPC_ACTION missing — the constraint is the point of the call (spec §4)');
    need(suite.slots?.AGENT_UTTERANCE, 'slots.AGENT_UTTERANCE missing — the W1 context input');
    const npcs = suite.slots?.PRESENT_NPCS;
    need(
      Array.isArray(npcs) && npcs.length >= 1 && npcs.every((p) => p?.id && p?.name),
      'slots.PRESENT_NPCS needs >= 1 {id,name} entries — npc_lines speakers validate against it',
    );
    if (Array.isArray(npcs)) {
      const dupes = npcs.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i);
      if (dupes.length) fatal.push(`duplicate npc ids: ${dupes.join(', ')}`);
    }
    // Contract §3: the engine renders the fixed action and the controller's
    // utterance to the timeline BEFORE this call, and Call 2 writes only what
    // follows. A suite whose TIMELINE_TAIL omits them makes the prompt assert
    // "이미 화면에 있다" about something that is not there — the model then
    // reconstructs the exchange and misassigns speakers. Fatal, not a warning:
    // this exact omission already cost a probe whose result was unattributable.
    const tail = [].concat(suite.slots?.TIMELINE_TAIL ?? []).join('\n');
    for (const [slot, label] of [
      ['FIXED_NPC_ACTION', 'the fixed action'],
      ['AGENT_UTTERANCE', "the controller's utterance"],
    ]) {
      const v = String(suite.slots?.[slot] ?? '').trim();
      if (v && !tail.includes(v)) {
        fatal.push(
          `slots.TIMELINE_TAIL does not carry ${slot} — contract §3 requires ${label} to be on ` +
            'the timeline before this call. Append it to TIMELINE_TAIL.',
        );
      }
    }
  }

  if (suite.call_type === 'reporter') {
    need(suite.slots?.EXPERIENCED, "slots.EXPERIENCED missing — the round's events are the reporter's only input (W1/W2)");
  }

  return { fatal, warn };
}
