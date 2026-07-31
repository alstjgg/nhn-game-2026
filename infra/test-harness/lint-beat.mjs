#!/usr/bin/env node
// Beat lint for narration suites. Paper check, zero calls.
//
//   node lint-beat.mjs <suite.json>
//
// Why this exists. Two defects cost 20 measured calls to rediscover, and both
// were answerable on paper from the suite alone:
//
//   1. The controller speaks in the scene but is not in PRESENT_NPCS, so Call 2
//      has no legal slot for that speech. The model puts it somewhere anyway —
//      first as a verbatim copy under a borrowed id, then (after the template
//      forbade copying) as a fresh line where an NPC takes over the controller's
//      role. Same damage either way: an NPC in the controller's seat says things
//      that move no state (I3/W4), so story and state split.
//   2. A fixed action that ASKS the controller something guarantees (1) — the
//      dialogue needs an answer and the only available speakers are NPCs.
//
// The rule lives in docs/dday-engine-minimal-request.md §6.1 and the call
// contract §3; this is the check that makes it free to enforce.
//
// Flags, never blocks — the author knows when an overlap is load-bearing.
// Hard contract requirements (TIMELINE_TAIL must carry the fixed action and the
// controller utterance) are enforced in lib/suite.mjs instead, where a run
// refuses before spending.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const suitePath = process.argv[2];
if (!suitePath) {
  console.error('usage: node lint-beat.mjs <suite.json>');
  process.exit(1);
}

const suite = JSON.parse(readFileSync(resolve(suitePath), 'utf8'));
if (suite.call_type !== 'narration') {
  console.error(`lint-beat is for narration suites; this one is "${suite.call_type}"`);
  process.exit(1);
}

const s = suite.slots ?? {};
const npcs = s.PRESENT_NPCS ?? [];
const tail = Array.isArray(s.TIMELINE_TAIL) ? s.TIMELINE_TAIL : [s.TIMELINE_TAIL ?? ''];
const fixed = String(s.FIXED_NPC_ACTION ?? '');
const utterance = String(s.AGENT_UTTERANCE ?? '');
const symptoms = Array.isArray(s.SCENE_SYMPTOMS) ? s.SCENE_SYMPTOMS : [];

const findings = [];
const flag = (check, msg, detail) => findings.push({ check, msg, detail });

// ── A. Beat boundary: does the fixed action demand a reply the call cannot make?
// Heuristic and deliberately broad — a false flag costs one read, a miss costs a
// probe. Question marks and second-person address are what "asks the controller"
// looks like in this scenario's register.
const SECOND_PERSON = /당신|그쪽|거기요|너희|여보세요/;
const asksQuestion = /[?？]/.test(fixed);
const addresses = SECOND_PERSON.test(fixed);
if (asksQuestion || addresses) {
  flag(
    'beat-boundary',
    '고정 사건이 통제관의 응답을 요구하는 것으로 보인다.',
    [
      asksQuestion ? '  의문형이 있다.' : null,
      addresses ? `  2인칭 호명이 있다: ${fixed.match(SECOND_PERSON)[0]}` : null,
      '  Call 2는 통제관 대사를 만들 수 없다(통제관은 PRESENT_NPCS에 없다).',
      '  대화에 구멍이 남으면 모델이 NPC로 그것을 메우고, 그 발화는 상태를 움직이지 못한다(I3/W4).',
      '  → 응답을 요구하지 않는 고정 사건으로 바꾸거나, 답이 다음 Call 1의 utterance가 되도록 비트를 이어 붙인다.',
      '  근거: docs/dday-engine-minimal-request.md §6.1 (실측 4/5)',
    ].filter(Boolean),
  );
}

// ── B. Speaker closure: everyone who speaks in the material must have a slot.
// "이름: 대사" at line start is how the timeline renders speech.
const legalIds = new Set(npcs.map((n) => n.id));
const legalNames = new Set(npcs.map((n) => String(n.name ?? '').split(/[\s—-]/)[0]).filter(Boolean));
const CONTROLLER = /^(통제관|나|플레이어)$/;

const spoken = new Map(); // speaker → first line seen
for (const line of tail) {
  const m = String(line).match(/^\s*([^:：\s]{1,12})\s*[:：]\s*(.+)$/);
  // Timeline lines open with a clock ("09:40 회선 A 착신"), which parses as a
  // speaker named "09". A speaker is never bare digits.
  if (m && !/^\d+$/.test(m[1])) spoken.set(m[1], m[2]);
}
for (const [who, said] of spoken) {
  if (legalIds.has(who) || legalNames.has(who)) continue;
  if (CONTROLLER.test(who)) {
    // Expected: the controller's line is Call 1's utterance, rendered by the
    // engine. Not an error — but it is the precondition check A is about.
    continue;
  }
  flag(
    'speaker-closure',
    `"${who}"가 직전 타임라인에서 말하는데 PRESENT_NPCS에 없다.`,
    [
      `  발화: ${said.slice(0, 40)}${said.length > 40 ? '…' : ''}`,
      '  이번 비트에도 이 인물이 말해야 한다면 Call 2에는 합법적 화자 자리가 없다.',
      '  → PRESENT_NPCS에 넣거나, 이 인물이 말할 필요가 없는 비트인지 확인한다.',
    ],
  );
}

// ── C. I12: symptoms carry movement, never magnitude.
for (const sym of symptoms) {
  const nums = String(sym).match(/\d+(\.\d+)?/g);
  if (nums) {
    flag('i12-number', '증상 문장에 숫자가 있다.', [
      `  ${sym}`,
      `  숫자: ${nums.join(', ')}`,
      '  상태는 증상으로만 드러난다 — "숨이 가빠졌다"이지 "공포 70"이 아니다(스펙 I12).',
      '  세계에 실재하는 수치(시각·마감)나 다이제틱 계기판이면 무시해도 된다.',
    ]);
  }
}

// ── report ──────────────────────────────────────────────────────────────────
const label = suite.experiment ?? suitePath;
if (!findings.length) {
  console.log(`✓ ${label} — beat lint clean (화자 닫힘 · 비트 경계 · I12)`);
  process.exit(0);
}

console.log(`${label} — ${findings.length} flag(s)\n`);
for (const f of findings) {
  console.log(`  [${f.check}] ${f.msg}`);
  for (const d of f.detail) console.log(d);
  console.log();
}
console.log('Flags, not verdicts — 저작자가 불가피한지 판단한다.');
