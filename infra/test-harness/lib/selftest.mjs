// Offline checks for the guarantees the harness claims. No network, no key.
//   node lib/selftest.mjs

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALL_TYPES } from './calltypes.mjs';
import { composeArm, verifyArmDiff } from './compose.mjs';
import { preflightArtifacts } from './record.mjs';
import { validateSuite } from './suite.mjs';

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
const opts = { templatesRoot: TEMPLATES };

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
  because: { referent: '회선 A의 발신자를 두고 판단했다.', block_ids: ['f1'] },
  rejected: { stance: 'a', reason: '확인이 먼저면 끊긴다.' },
  utterance: '천천히 말해 주세요.',
};
check('accepts a well-formed judgment', () => assert.deepEqual(spec.validate(good, ctx), []));
check('rejects a stance outside the set', () =>
  assert.ok(spec.validate({ ...good, stance: 'z' }, ctx).some((p) => /not in stance set/.test(p))));
check('rejects rejected===stance', () =>
  assert.ok(spec.validate({ ...good, rejected: { stance: 'b', reason: 'x' } }, ctx).some((p) => /equals stance/.test(p))));
check('rejects an empty referent', () =>
  assert.ok(spec.validate({ ...good, because: { referent: ' ', block_ids: [] } }, ctx).some((p) => /referent empty/.test(p))));
check('treats a hallucinated block id as soft (recorded, not retried)', () => {
  const p = spec.validate({ ...good, because: { referent: 'r', block_ids: ['ghost'] } }, ctx);
  assert.equal(p.length, 1);
  assert.match(p[0], /^__soft__/);
});
check('summarize surfaces the placebo discriminator input', () => {
  const s = spec.summarize(good, ctx);
  assert.equal(s.stance, 'b');
  assert.match(s.because_referent, /발신자/);
  assert.deepEqual(s.because_invalid_ids, []);
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

console.log('artifact preflight (refuse before spending, §3 rule 4):');
check('refuses when any selected arm already has artifacts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'harness-selftest-'));
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
