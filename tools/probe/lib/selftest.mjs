// Offline checks for the guarantees the probe runner claims. No network, no key.
//   node tools/probe/lib/selftest.mjs

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CALL_TYPES } from '../../lib/calls.mjs';
import { composeArm } from '../../lib/compose.mjs';
import { PROMPTS } from '../../lib/prompts.mjs';
import { verifyArmDiff } from './armdiff.mjs';
import { preflightArtifacts } from './record.mjs';
import { validateSuite } from './suite.mjs';

const opts = { prompts: PROMPTS };

const base = () => ({
  experiment: 'SELFTEST',
  call_type: 'judgment',
  channel: 'C-BLOCK',
  template_version: 'v0.4',
  model: 'claude-haiku-4-5-20251001',
  temperament: 'k1',
  pre_registration: { hypothesis: 'h', n_per_arm: 1, drop_condition: 'd' },
  slots: {
    FLAW: '[결함] 시험.',
    INCIDENT: '[내력] 시험.',
    PRIORITY_LIST: ['하나', '둘'],
    TIMELINE_EXCERPT: ['09:40 착신.'],
    GATE_QUESTION: '첫 마디로 무엇을 하는가?',
    STANCE_SET: [
      { id: 'a', label: '확인한다' },
      { id: 'b', label: '듣는다' },
    ],
  },
  arms: { baseline: { BLOCKS: [] }, live: { BLOCKS: [{ id: 'f1', text: '겁내고 있다.' }] } },
});

let pass = 0;
const check = (name, fn) => {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
};

console.log('compose:');
check('fills every slot and leaves no markers', () => {
  const { system, user } = composeArm(base(), 'live', opts);
  assert.ok(!/\{[A-Z_]+\}/.test(system + user), 'unfilled marker survived');
  assert.match(system, /절차를 지키는 것으로/, 'k1 temperament missing');
  assert.match(user, /f1: 겁내고 있다\./, 'block not rendered');
});

check('baseline renders an explicit empty block section', () => {
  const { user } = composeArm(base(), 'baseline', opts);
  assert.match(user, /\(없음\)/);
});

check('neutral temperament composes without leaving a hole', () => {
  const s = base();
  s.temperament = 'neutral';
  const { system } = composeArm(s, 'baseline', opts);
  assert.ok(!/\n\n\n/.test(system), 'blank run left by empty temperament');
});

check('an unknown slot in the template is a hard error', () => {
  assert.throws(() => composeArm({ ...base(), template_version: 'nope' }, 'live', opts));
});

console.log('arm diff:');
check('clean when arms vary only in the channel slot', () => {
  assert.deepEqual(verifyArmDiff(base(), opts), []);
});

check('catches a leak outside the channel slot', () => {
  const s = base();
  s.arms.live.INCIDENT = '[내력] 다른 내력.'; // not in CHANNEL_SLOTS['C-BLOCK']
  const problems = verifyArmDiff(s, opts);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /differ outside the C-BLOCK slot/);
});

check('catches a temperament swap smuggled into a C-BLOCK probe', () => {
  const s = base();
  s.arms.live.temperament = 'k2';
  assert.equal(verifyArmDiff(s, opts).length, 1);
});

console.log('suite gate:');
check('refuses a suite with no drop condition', () => {
  const s = base();
  delete s.pre_registration.drop_condition;
  assert.ok(validateSuite(s).fatal.some((p) => /drop_condition/.test(p)));
});

check('refuses an unpinned model alias', () => {
  assert.ok(validateSuite({ ...base(), model: 'haiku' }).fatal.some((p) => /unpinned alias/.test(p)));
});

check('refuses a missing baseline arm', () => {
  const s = base();
  s.arms = { live: s.arms.live };
  assert.ok(validateSuite(s).fatal.some((p) => /baseline/.test(p)));
});

check('warns about a missing placebo without blocking', () => {
  const { fatal, warn } = validateSuite(base());
  assert.deepEqual(fatal, []);
  assert.ok(warn.some((w) => /placebo/.test(w)));
});

console.log('judgment validation:');
const spec = CALL_TYPES.judgment;
const ctx = { suite: base(), arm: 'live' };
const good = {
  inner_note: '숨소리가 걸린다.',
  stance: 'b',
  because_referent: '회선 A의 발신자를 두고 판단했다.',
  because_block_ids: ['f1'],
  rejected_stance: 'a',
  rejected_reason: '확인이 먼저면 끊긴다.',
  utterance: '천천히 말해 주세요.',
};
check('accepts a well-formed judgment', () => assert.deepEqual(spec.validate(good, ctx), []));
check('rejects a stance outside the set', () =>
  assert.ok(spec.validate({ ...good, stance: 'z' }, ctx).some((p) => /not in stance set/.test(p))));
check('rejects an empty referent', () =>
  assert.ok(spec.validate({ ...good, because_referent: ' ' }, ctx).some((p) => /because_referent empty/.test(p))));
// The rejected pair is diagnostic-only and where the A16 boundary leak lands:
// soft — recorded, never retried, call kept. Enacted 2026-07-30.
check('rejected===stance is soft (recorded, not retried)', () => {
  const p = spec.validate({ ...good, rejected_stance: 'b' }, ctx);
  assert.equal(p.length, 1);
  assert.match(p[0], /^__soft__.*equals stance/);
});
check('empty rejected_reason is soft', () => {
  const p = spec.validate({ ...good, rejected_reason: '' }, ctx);
  assert.equal(p.length, 1);
  assert.match(p[0], /^__soft__.*rejected_reason empty/);
});
check('treats a hallucinated block id as soft (recorded, not retried)', () => {
  const p = spec.validate({ ...good, because_block_ids: ['ghost'] }, ctx);
  assert.equal(p.length, 1);
  assert.match(p[0], /^__soft__/);
});
check('summarize surfaces the placebo discriminator input', () => {
  const s = spec.summarize(good, ctx);
  assert.equal(s.stance, 'b');
  assert.match(s.because_referent, /발신자/);
  assert.deepEqual(s.because_invalid_ids, []);
});

// The RB1 failure, frozen as a regression: `because` arriving as a string with
// the inner keys hoisted must be caught, not silently summarized into nulls.
check('rejects the RB1 nested-object malformation', () => {
  const malformed = {
    inner_note: '…',
    stance: 'b',
    because: '\n<parameter name="referent">회선 A 발신자',
    block_ids: ['f1'],
    utterance: '…',
  };
  const all = spec.validate(malformed, ctx);
  const hard = all.filter((x) => !x.startsWith('__soft__'));
  assert.ok(hard.some((x) => /because_referent empty/.test(x)));
  assert.ok(hard.some((x) => /because_block_ids not an array/.test(x)));
  // The rejected-field damage is still reported, but soft (A16).
  assert.ok(all.some((x) => /^__soft__.*rejected_stance malformed/.test(x)));
});

// The A16 boundary leak, frozen as a regression: rejected_stance swallows the
// closing tag and the next parameter's opening tag, rejected_reason vanishes —
// but stance/inner_note/referent/utterance all survive. The call must be KEPT
// (soft problems only), because hard-discarding it is what made arms
// differently-filtered samples across RB1/RB2/P1a/P1b.
check('the A16 boundary leak yields only soft problems — call is kept', () => {
  const leaked = {
    ...good,
    rejected_stance: 'a</rejected_stance>\n<parameter name="rejected_reason">확인이 먼저면 끊긴다.',
    rejected_reason: undefined,
  };
  const p = spec.validate(leaked, ctx);
  assert.ok(p.length >= 1, 'the leak must still be recorded');
  assert.ok(p.every((x) => x.startsWith('__soft__')), `hard problem would discard the call: ${p}`);
});

check('summarize nulls a leaked rejected_stance and flags it', () => {
  const leaked = { ...good, rejected_stance: 'a</rejected_stance>\n<parameter name="rejected_reason">…' };
  const s = spec.summarize(leaked, ctx);
  assert.equal(s.rejected_stance, null);
  assert.equal(s.rejected_malformed, true);
  assert.equal(spec.summarize(good, ctx).rejected_malformed, false);
});

check('no nested objects survive in the judgment schema', () => {
  const props = spec.buildTool(base()).input_schema.properties;
  for (const [name, s] of Object.entries(props)) {
    assert.notEqual(s.type, 'object', `${name} is a nested object — banned, see run log A7`);
    if (s.type === 'array') assert.equal(s.items?.type, 'string', `${name} is not an array of scalars`);
  }
});

console.log('stance coverage (sampled diagnostic — never a §3.1 write verdict):');
check('flags an offered stance that went unobserved', () => {
  const c = spec.coverage([{ stance: 'a' }, { stance: 'a' }], base());
  assert.equal(c.status, 'sampled');
  assert.deepEqual(c.offered, ['a', 'b']);
  assert.deepEqual(c.selected, ['a']);
  assert.deepEqual(c.unobserved, ['b']);
});
check('clean when every offered stance appears', () => {
  const c = spec.coverage([{ stance: 'a' }, { stance: 'b' }], base());
  assert.deepEqual(c.unobserved, []);
});
check('unknown, not "all dead", when nothing was kept', () => {
  const c = spec.coverage([], base());
  assert.equal(c.status, 'unknown');
  assert.deepEqual(c.selected, []);
  assert.equal(c.unobserved, null);
});

console.log('composer follows the call type\'s slot declaration:');
check('reporter call type composes without any judgment slot', () => {
  const dir = mkdtempSync(join(tmpdir(), 'probe-selftest-'));
  try {
    // The three roots are separate on purpose (prompts.mjs): the system layer
    // belongs to the proxy, the user layer ships as data, temperament is one
    // flat shared roster. Building them apart here is what proves composeArm
    // never assumes they sit under a common parent.
    const roots = {
      systemRoot: join(dir, 'system'),
      userRoot: join(dir, 'user'),
      temperamentRoot: join(dir, 'temperament'),
    };
    mkdirSync(join(roots.systemRoot, 'reporter'), { recursive: true });
    mkdirSync(join(roots.userRoot, 'reporter'), { recursive: true });
    mkdirSync(roots.temperamentRoot, { recursive: true });
    writeFileSync(join(roots.systemRoot, 'reporter', 'base-v0.0.md'), '{TEMPERAMENT}');
    writeFileSync(join(roots.userRoot, 'reporter', 'user-v0.0.md'), '{EXPERIENCED}');
    writeFileSync(join(roots.temperamentRoot, 'neutral.md'), '(무주입)');
    const suite = {
      call_type: 'reporter',
      template_version: 'v0.0',
      temperament: 'neutral',
      slots: { EXPERIENCED: '09:40 회선 A 착신을 겪었다.' },
      arms: { baseline: {} },
    };
    const { system, user } = composeArm(suite, 'baseline', { prompts: roots });
    assert.equal(system, '(무주입)');
    assert.equal(user, '09:40 회선 A 착신을 겪었다.');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check('reporter v0.2 composes against the real templates with the shared k1 temperament', () => {
  const suite = {
    call_type: 'reporter',
    template_version: 'v0.1',
    temperament: 'k1',
    slots: {
      EXPERIENCED: ['09:40 회선 A 착신. 준비된 문장을 읽는 목소리.', '(속으로) 숨소리가 걸린다.'],
      REPORT_GUIDANCE: '보고서 본문은 20~30문장.',
    },
    arms: { baseline: {} },
  };
  const { system, user } = composeArm(suite, 'baseline', opts);
  assert.match(system, /절차를 지키는 것으로/, 'shared k1 temperament missing from reporter system');
  assert.match(user, /09:40 회선 A 착신/, 'EXPERIENCED lines not rendered');
  assert.match(user, /20~30문장/, 'REPORT_GUIDANCE not rendered');
});

const narrSuite = () => ({
  call_type: 'narration',
  template_version: 'v0.2',
  slots: {
    TIMELINE_TAIL: ['09:40 회선 A 착신.'],
    AGENT_UTTERANCE: '천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.',
    FIXED_NPC_ACTION: '발신자가 낭독을 멈추고, 대본에 없는 말을 한다.',
    SCENE_SYMPTOMS: ['발신자의 숨이 눈에 띄게 가빠졌다.'],
    PRESENT_NPCS: [
      { id: 'caller_a', name: '회선 A 발신자' },
      { id: 'hbr', name: '황보람 — 통신 담당' },
    ],
  },
  arms: { baseline: {} },
});

check('narration v0.2 composes against the real templates, no temperament involved', () => {
  const { system, user } = composeArm(narrSuite(), 'baseline', opts);
  assert.ok(!/\{[A-Z_]+\}/.test(system + user), 'unfilled marker survived');
  assert.match(user, /caller_a — 회선 A 발신자/, 'PRESENT_NPCS not rendered');
  assert.match(user, /이미 일어난 일/, 'reaction-generation framing missing');
  assert.match(system, /반응이지 사건이 아니다/, 'v0.2 role framing missing');
});

// The side split is what stopped room-side NPCs from taking the controller's
// seat (contract §3). The same rule stated only in the constraint list left it
// at 2/5; grouping plus the rule on the label took it to 0/5 — so the label text
// is load-bearing, not decoration.
check('PRESENT_NPCS renders grouped by side, with the role rule on the label', () => {
  const s = narrSuite();
  const side = { caller_a: 'line', hbr: 'room' };
  s.slots.PRESENT_NPCS = s.slots.PRESENT_NPCS.map((p) => ({ ...p, side: side[p.id] }));
  const { user } = composeArm(s, 'baseline', opts);
  assert.match(user, /\[회선 너머 — 통제관에게만 말한다\]\ncaller_a/);
  assert.match(user, /\[상황실 안 — 서로에게만 말한다\. 회선 저쪽에는 말을 걸지 않는다\]\nhbr/);
});

check('PRESENT_NPCS without side stays flat — existing suites unaffected', () => {
  const { user } = composeArm(narrSuite(), 'baseline', opts);
  assert.ok(!/회선 너머/.test(user), 'grouping applied to an unmarked roster');
});

console.log('narration validation:');
const nspec = CALL_TYPES.narration;
const nctx = { suite: narrSuite(), arm: 'baseline' };
const ngood = {
  timeline_entries: ['수화기 너머의 낭독이 뚝 끊긴다.', '황보람이 콘솔에서 고개를 든다.'],
  npc_lines: ['caller_a: …듣고 있어요?'],
};
check('accepts a well-formed narration', () => assert.deepEqual(nspec.validate(ngood, nctx), []));
check('the schema carries no constraint_echo (contract v1 §3)', () => {
  const props = nspec.buildTool(narrSuite()).input_schema.properties;
  assert.deepEqual(Object.keys(props), ['timeline_entries', 'npc_lines']);
});
check('empty timeline_entries is hard', () =>
  assert.ok(nspec.validate({ ...ngood, timeline_entries: [] }, nctx).some((p) => /timeline_entries empty/.test(p))));
check('an npc line without an "id:" prefix is hard — unattributable, W2-dead', () =>
  assert.ok(nspec.validate({ ...ngood, npc_lines: ['그냥 대사만 있는 줄'] }, nctx)
    .some((p) => /no "id: 대사" prefix/.test(p) && !p.startsWith('__soft__'))));
check('an invented speaker is soft — an observation, never retried', () => {
  const p = nspec.validate({ ...ngood, npc_lines: ['ghost_npc: 나는 없다.'] }, nctx);
  assert.equal(p.length, 1);
  assert.match(p[0], /^__soft__.*unknown speaker: ghost_npc/);
});
// The controller is absent from PRESENT_NPCS, so re-emitting its utterance
// passes the speaker check on a legal id — this is the check that catches it.
check('re-emitting the controller utterance under a legal id is soft, not silent', () => {
  const p = nspec.validate(
    { ...ngood, npc_lines: ['hbr: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.'] },
    nctx,
  );
  assert.equal(p.length, 1);
  assert.match(p[0], /^__soft__.*re-emits the controller utterance as hbr/);
  assert.equal(nspec.summarize(
    { ...ngood, npc_lines: ['hbr: 천천히 말해 주세요. 지금 그쪽이 안전한지부터 듣고 싶습니다.'] },
    nctx,
  ).utterance_echo_count, 1);
});
check('an ordinary line is not mistaken for an utterance echo', () => {
  assert.deepEqual(nspec.validate(ngood, nctx), []);
  assert.equal(nspec.summarize(ngood, nctx).utterance_echo_count, 0);
});
check('no nested objects in the narration schema', () => {
  const props = nspec.buildTool(narrSuite()).input_schema.properties;
  for (const [name, s] of Object.entries(props)) {
    assert.notEqual(s.type, 'object', `${name} is a nested object — banned, see run log A7`);
    if (s.type === 'array') assert.equal(s.items?.type, 'string', `${name} is not an array of scalars`);
  }
});

console.log('reporter validation:');
const rspec = CALL_TYPES.reporter;
const rgood = {
  facts: ['09:40 회선 A로 착신이 있었다.', '발신자는 준비된 문장을 읽었다.'],
  report_body: '## 라운드 기록\n\n첫 착신부터 숨소리가 걸렸다.',
};
check('accepts a well-formed report', () => assert.deepEqual(rspec.validate(rgood, {}), []));
check('empty facts is hard — a round always has observable events', () =>
  assert.ok(rspec.validate({ ...rgood, facts: [] }, {}).some((p) => /facts empty/.test(p))));
check('empty report_body is hard', () =>
  assert.ok(rspec.validate({ ...rgood, report_body: '' }, {}).some((p) => /report_body empty/.test(p))));
check('report_body is the LAST schema field — the SSE seam (contracts doc §SSE)', () => {
  const keys = Object.keys(rspec.buildTool().input_schema.properties);
  assert.deepEqual(keys, ['facts', 'report_body']);
});
check('no nested objects in the reporter schema', () => {
  const props = rspec.buildTool().input_schema.properties;
  for (const [name, s] of Object.entries(props)) {
    assert.notEqual(s.type, 'object', `${name} is a nested object — banned, see run log A7`);
    if (s.type === 'array') assert.equal(s.items?.type, 'string', `${name} is not an array of scalars`);
  }
});

console.log('artifact preflight (refuse before spending, §3 rule 4):');
check('refuses when any selected arm already has artifacts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'probe-selftest-'));
  try {
    writeFileSync(join(dir, 'calls-live.md'), 'existing');
    assert.throws(
      () => preflightArtifacts({ outDir: dir, arms: ['baseline', 'live'], force: false }),
      /before any call is spent/,
    );
    assert.doesNotThrow(() => preflightArtifacts({ outDir: dir, arms: ['baseline'], force: false }));
    assert.doesNotThrow(() => preflightArtifacts({ outDir: dir, arms: ['live'], force: true }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`\n${pass} checks passed.`);
