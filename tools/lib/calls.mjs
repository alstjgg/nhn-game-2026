// Call-type registry — the three calls of [call contracts v1](../../docs/contract-calls.md),
// as executable definitions. Shared by the probe runner and the full-run driver.
//
// `buildTool` IS the contract's output schema. It is the only executable copy in
// the repo today: `src/shared/contracts.ts` transcribes the same document for the
// bundle, and the proxy will need a third copy outside the root install. Three
// copies of one contract need a drift gate, the way the datapack schemas already
// have one (physical architecture §3.1) — that gate does not exist yet.
//
// The probe layers a test program on top: a test type is a (call type × suite)
// pair, the suite is data, and adding one means one entry below plus the two
// prompt files. The runner, arm-diff check, recorder, and CLI are untouched.
//
// Each entry declares:
//   promptDir    which <call> dir holds the prompts. base-*.md lives under the
//                proxy's prompts root, user-*.md under data/prompts (prompts.mjs)
//   slots        slot names the composer must fill (unfilled → hard error)
//   buildTool    per-suite tool schema, or null for prose output
//   validate     response → problem list (drives schema_retries)
//   summarize    response → the fields that land in metrics-*.json
//
// Field order inside input_schema.properties is load-bearing: it is the order the
// model generates in. judgment fixes inner_note → stance → because_referent →
// because_block_ids → rejected_stance → rejected_reason → utterance (deep-test
// plan §7.1). Do not reorder without a shape re-validation.
//
// Every field is a SCALAR OR ARRAY OF SCALARS — no nested objects. `because` and
// `rejected` used to be objects; in RB1 (2026-07-30) the model emitted `because`
// as a string holding a literal `<parameter name="referent">…` with the inner
// keys hoisted to the top level, on 7 of 17 baseline attempts, and the
// malformation was arm-correlated — the no-block arm failed, the block arm did
// not. That makes two arms differently-filtered samples, which voids the
// comparison (plan §8.5 step 4). Nested objects are banned here; see run log A7.

/** Stance ids a suite presents at its gate. */
const stanceIds = (suite) => (suite.slots.STANCE_SET ?? []).map((s) => s.id);

/** Block ids present in a given arm — the only legal `because_block_ids` values. */
const blockIds = (suite, arm) => (suite.arms[arm].BLOCKS ?? []).map((b) => b.id);

const judgment = {
  promptDir: 'judgment',
  slots: [
    'FLAW',
    'INCIDENT',
    'PRIORITY_LIST',
    'TEMPERAMENT',
    'TIMELINE_EXCERPT',
    'BLOCKS',
    'GATE_QUESTION',
    'STANCE_SET',
  ],

  buildTool(suite) {
    const ids = stanceIds(suite);
    if (ids.length < 2) throw new Error('judgment: slots.STANCE_SET needs >= 2 stances');
    return {
      name: 'judgment',
      description:
        '이 게이트에서의 판단을 제출한다. 정확히 한 번만 호출한다.',
      input_schema: {
        type: 'object',
        properties: {
          inner_note: {
            type: 'string',
            description:
              '고르기 전에 지나간 생각. 1~3문장. 무엇이 눈에 걸렸고 무엇을 재었는지.',
          },
          stance: {
            type: 'string',
            enum: ids,
            description: '고른 스탠스의 id.',
          },
          because_referent: {
            type: 'string',
            description:
              '고른 뒤에 쓴다 — 이 판단이 향한 사람 또는 대상을 이름으로 지목한다. 1~2문장. 누구를 두고 이렇게 했는지가 반드시 드러나야 한다.',
          },
          because_block_ids: {
            type: 'array',
            items: { type: 'string' },
            description:
              '판단의 근거가 된 [알려진 것] 블럭의 id. 근거가 없으면 빈 배열.',
          },
          rejected_stance: {
            type: 'string',
            enum: ids,
            description: '고르지 않은 것 가운데 가장 가까웠던 하나의 id.',
          },
          rejected_reason: {
            type: 'string',
            description: '그것을 왜 버렸는지 한 줄.',
          },
          utterance: {
            type: 'string',
            description:
              '실제로 회선에 나가는 무전. 한두 문장. 사무적으로, 짧게 끊고 해라체로 끝맺는다 — `출발했다.`는 맞고 `출발했습니다.`(존댓말)도 `출발했어.`(해체)도 틀리다. 문장 조각도 좋다.',
          },
        },
        required: [
          'inner_note',
          'stance',
          'because_referent',
          'because_block_ids',
          'rejected_stance',
          'rejected_reason',
          'utterance',
        ],
      },
    };
  },

  validate(input, { suite, arm }) {
    const problems = [];
    const ids = stanceIds(suite);
    const legalBlocks = new Set(blockIds(suite, arm));

    if (!input || typeof input !== 'object') return ['response was not an object'];
    if (!input.inner_note?.trim()) problems.push('inner_note empty');
    if (!ids.includes(input.stance)) problems.push(`stance "${input.stance}" not in stance set`);
    if (!input.because_referent?.trim()) problems.push('because_referent empty');
    if (!Array.isArray(input.because_block_ids)) problems.push('because_block_ids not an array');
    else {
      const bogus = input.because_block_ids.filter((id) => !legalBlocks.has(id));
      // Recorded, never retried: a hallucinated block id is data about the
      // mechanism (prior program tracked because_invalid_id_total), not a
      // malformed response. Retrying would erase the observation.
      if (bogus.length) problems.push(`__soft__ because_block_ids unknown: ${bogus.join(',')}`);
    }
    // The rejected pair is diagnostic-only (plan §7.1) and it is where the
    // recurring boundary-leak malformation lands (rate 0–57% between runs, no
    // correlate found — run log A16). Soft: record, never retry, keep the call.
    // Hard-discarding here threw away valid stances and made arms
    // differently-filtered samples, which is what kept tripping the
    // comparability stop (§8.5 step 4). Enacted by 민서 2026-07-30.
    if (!ids.includes(input.rejected_stance)) problems.push('__soft__ rejected_stance malformed or not in stance set');
    else if (input.rejected_stance === input.stance) problems.push('__soft__ rejected_stance equals stance');
    if (!input.rejected_reason?.trim()) problems.push('__soft__ rejected_reason empty');
    if (!input.utterance?.trim()) problems.push('utterance empty');
    return problems;
  },

  // Stance coverage — a sampled diagnostic, not a write-test verdict. Absence
  // at probe N is not structural unreachability (the program's own sampling
  // caveat: 3/3 is consistent with a true rate of ~37%). The architecture
  // spec's §3.1 write test is a static check on the delta table plus the
  // reachability audit (§5.2 B1); this output only flags stances worth
  // checking there. Zero valid calls means unknown, not "all dead".
  coverage(keptRecords, suite) {
    const offered = stanceIds(suite);
    if (!keptRecords.length) {
      return { status: 'unknown', offered, selected: [], unobserved: null };
    }
    const observed = new Set(keptRecords.map((r) => r.stance));
    return {
      status: 'sampled',
      offered,
      selected: offered.filter((id) => observed.has(id)),
      unobserved: offered.filter((id) => !observed.has(id)),
    };
  },

  // Offline stand-in used only by the dryrun transport. A generic schema filler
  // cannot know that rejected_stance must differ from stance, so the call type
  // that owns the constraint owns the stand-in.
  dryRunPayload(suite, arm) {
    const ids = stanceIds(suite);
    return {
      inner_note: '(dry-run) 판단 전 메모 자리.',
      stance: ids[0],
      because_referent: '(dry-run) 판단이 향한 대상을 지목하는 자리.',
      because_block_ids: blockIds(suite, arm),
      rejected_stance: ids[1],
      rejected_reason: '(dry-run) 버린 이유 자리.',
      utterance: '(dry-run) 입에서 나가는 말 자리.',
    };
  },

  summarize(input, { suite, arm }) {
    const legalBlocks = new Set(blockIds(suite, arm));
    const cited = input.because_block_ids ?? [];
    const ids = stanceIds(suite);
    // A malformed rejected_stance (the A16 boundary leak) is nulled, not
    // passed through — the leak string contains the swallowed rejected_reason
    // and would corrupt any tally over this field. The flag preserves the count.
    const rejectedOk = ids.includes(input.rejected_stance);
    return {
      stance: input.stance,
      because_referent: input.because_referent ?? null,
      because_block_ids: cited,
      because_invalid_ids: cited.filter((id) => !legalBlocks.has(id)),
      rejected_stance: rejectedOk ? input.rejected_stance : null,
      rejected_malformed: !rejectedOk,
      utterance_chars: (input.utterance ?? '').length,
      inner_note_chars: (input.inner_note ?? '').length,
    };
  },
};

// ── Call 2 — Narration / NPC dialogue ───────────────────────────────────────
// Contract: docs/contract-calls.md §2. One bundled call per beat (spec §4).
// Load-bearing properties — mineable yield and constraint compliance — are
// test-program material; the schema structures the output, the human checks the
// constraint. Output units match mining units: timeline_entries is an array of
// sentences (I1/W3 — the mining UI operates on these directly, no parsing).

/** NPC ids present in this beat — the only legal npc_lines speakers. */
const npcIds = (suite) => (suite.slots.PRESENT_NPCS ?? []).map((p) => p.id);

/** "npc_id: 대사" — flat-string encoding because nested objects are banned (A7). */
const NPC_LINE = /^(\S+):\s*(.+)$/;

/**
 * Verbatim re-emission detector, NOT a paraphrase detector. The observed failure
 * is an exact copy of the controller's utterance handed to an NPC, so a shared
 * 15-char normalized window is enough and stays explainable. A near-miss it
 * cannot catch is a soft observation lost, never a wrong retry.
 */
const normLine = (s) => String(s ?? '').replace(/[\s"'“”‘’.,!?…·:;-]/g, '');
function echoesUtterance(line, utterance) {
  const a = normLine(line);
  const b = normLine(utterance);
  if (a.length < 15 || b.length < 15) return false;
  return a.includes(b.slice(0, 15)) || b.includes(a.slice(0, 15));
}

const narration = {
  promptDir: 'narration',
  slots: [
    'TIMELINE_TAIL',
    'AGENT_UTTERANCE',
    'FIXED_NPC_ACTION',
    'SCENE_SYMPTOMS',
    'PRESENT_NPCS',
  ],

  buildTool(suite) {
    if (npcIds(suite).length < 1) throw new Error('narration: slots.PRESENT_NPCS needs >= 1 npc');
    return {
      name: 'narration',
      description: '이 비트의 반응을 기록한다. 정확히 한 번만 호출한다.',
      input_schema: {
        type: 'object',
        properties: {
          timeline_entries: {
            type: 'array',
            items: { type: 'string' },
            description:
              '고정 사건에 뒤따르는 반응과 장면의 결. 4~5개. 한 항목은 한 문장이다 — 마침표는 항목의 맨 끝에 하나뿐이고, 항목 안에서 두 문장을 잇지 않는다. 이미 타임라인에 있는 것(고정 사건·요원 발화)은 다시 쓰지 않는다. 현장에서 남기는 짧은 기록이다 — 반말체로 끝맺는다.',
          },
          // `maxItems: 1` is the ONE mechanical half of the misattribution fix
          // (handoff §3.3). The rest is prompt wording, deliberately: the player
          // ruled that a refused beat is worse than an imperfect one, so there
          // is no validator and no drop reason for a wrong-but-legal speaker.
          // The cap only stops OVERPRODUCTION — three lines in one beat, which
          // is what put the agent's own questions in 표기웅's mouth — by making
          // the schema refuse it rather than truncating after the fact.
          npc_lines: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 1,
            description:
              '이 비트의 대사. 많아야 한 줄이고, 말하는 사람도 한 명뿐이다. 항목은 "인물id: 대사" 형식이며 [현장의 인물]에 있는 id만 쓴다. 되묻지 않는다 — 물음이거나 요원의 대답을 요구하는 말은 쓸 수 없다. 대사가 없는 비트가 정상이다. 없으면 빈 배열.',
          },
        },
        required: ['timeline_entries', 'npc_lines'],
      },
    };
  },

  validate(input, { suite }) {
    const problems = [];
    if (!input || typeof input !== 'object') return ['response was not an object'];

    if (!Array.isArray(input.timeline_entries)) problems.push('timeline_entries not an array');
    else if (!input.timeline_entries.length) problems.push('timeline_entries empty');
    else if (input.timeline_entries.some((e) => !String(e ?? '').trim()))
      problems.push('timeline_entries has an empty entry');

    if (!Array.isArray(input.npc_lines)) problems.push('npc_lines not an array');
    else {
      const legal = new Set(npcIds(suite));
      for (const line of input.npc_lines) {
        const m = String(line ?? '').match(NPC_LINE);
        // A missing "id:" prefix is form breakage — the line cannot be
        // attributed, so it cannot go on the timeline and W2 mining is dead on
        // it. Hard, retry.
        if (!m) problems.push(`npc_lines entry has no "id: 대사" prefix: ${String(line).slice(0, 40)}`);
        // An invented speaker is an observation about the model, not a
        // malformed response — record it, never retry (retrying erases the
        // observation). Production drops the offending line instead; see the
        // contracts doc §3. Same grading as judgment's hallucinated block ids.
        else if (!legal.has(m[1])) problems.push(`__soft__ npc_lines unknown speaker: ${m[1]}`);
        // The controller is not in PRESENT_NPCS, so re-emitting its utterance
        // as someone's dialogue passes the speaker check with a legal id. Soft:
        // it is a measurement of restatement tendency, and the line is
        // droppable in production the same way.
        else if (m && echoesUtterance(m[2], suite.slots?.AGENT_UTTERANCE)) {
          problems.push(`__soft__ npc_lines re-emits the controller utterance as ${m[1]}`);
        }
      }
    }
    return problems;
  },

  summarize(input, { suite }) {
    const legal = new Set(npcIds(suite));
    const entries = input.timeline_entries ?? [];
    const lines = input.npc_lines ?? [];
    const parsed = lines.map((l) => String(l ?? '').match(NPC_LINE)).filter(Boolean);
    const speakers = parsed.map((m) => m[1]);
    return {
      // Mineable-yield inputs for the §5.3 mineability log — counts, not verdicts.
      entry_count: entries.length,
      entry_chars: entries.join('').length,
      npc_line_count: lines.length,
      speakers,
      unknown_speaker_ids: speakers.filter((id) => !legal.has(id)),
      utterance_echo_count: parsed.filter((m) =>
        echoesUtterance(m[2], suite.slots?.AGENT_UTTERANCE),
      ).length,
    };
  },

  dryRunPayload(suite) {
    const ids = npcIds(suite);
    return {
      timeline_entries: ['(dry-run) 반응 서술 자리.'],
      npc_lines: ids.length ? [`${ids[0]}: (dry-run) 대사 자리.`] : [],
    };
  },
};

// ── Call 3 — Reporter ───────────────────────────────────────────────────────
// Contract: docs/contract-calls.md §3. 사실/판단 분리는 2안(스키마 확장,
// 07-31 윤석): facts = 객관로그 행, report_body = 자필 보고서. 실용성이 없으면
// 폐기하고 3안(엔진 로그)으로 격하 — 스모크의 drop_condition이 그 게이트다.
// (그 줄은 분리를 정한 시점의 기록이다. report_body는 prompts reporter v0.3에서
// 무전 상황 보고로 바뀌었고, 아래 필드 설명이 현행이다.)
//
// Field order is load-bearing twice over: facts-first is the extraction anchor
// (본문 오염 감소 가설), and report_body-LAST is what keeps the SSE option open
// (input_json_delta의 꼬리 = 본문 — contracts doc §SSE). Do not reorder.
//
// Whether each facts row is actually factual (no judgment/interpretation mixed
// in) is not machine-checkable — that is the smoke's human check, per the
// documented precedent (slice 모순을 보고서 5편 중 3편이 흡수).
const reporter = {
  promptDir: 'reporter',
  // Temperament files are per-scenario shared assets — the reporter reads the
  // SAME file the judgment call reads (spec §4: reporter system = instructions
  // + temperament). One source; duplicating them under templates/reporter/
  // would let the two calls' temperaments drift apart silently.
  slots: ['TEMPERAMENT', 'EXPERIENCED', 'REPORT_GUIDANCE'],

  buildTool() {
    return {
      name: 'reporter',
      description: '이번 라운드의 기록을 남긴다. 정확히 한 번만 호출한다.',
      input_schema: {
        type: 'object',
        properties: {
          facts: {
            type: 'array',
            items: { type: 'string' },
            description:
              '객관 기록. 이 라운드에 실제로 일어났거나 관찰된 것만, 한 항목에 한 문장. 생각·해석·평가 금지. 업무 격식 존댓말로 쓴다.',
          },
          report_body: {
            type: 'string',
            description:
              '무전 상황 보고 (markdown). 교신 말미에 본부로 보내는 짧은 구두 보고 — 무엇이 걸렸고, 왜 그렇게 판단했는지. 업무 격식 존댓말로 쓴다.',
          },
        },
        required: ['facts', 'report_body'],
      },
    };
  },

  validate(input) {
    const problems = [];
    if (!input || typeof input !== 'object') return ['response was not an object'];
    if (!Array.isArray(input.facts)) problems.push('facts not an array');
    // A round always contains observable events (the EXPERIENCED slot is never
    // empty), so an empty facts array is form breakage, not an observation.
    else if (!input.facts.some((f) => String(f ?? '').trim())) problems.push('facts empty');
    else if (input.facts.some((f) => !String(f ?? '').trim())) problems.push('facts has an empty entry');
    if (!input.report_body?.trim()) problems.push('report_body empty');
    return problems;
  },

  summarize(input) {
    const facts = (input.facts ?? []).filter((f) => String(f ?? '').trim());
    const body = input.report_body ?? '';
    return {
      facts_count: facts.length,
      facts_chars: facts.join('').length,
      body_chars: body.length,
      // Crude sentence count for the provisional 20~30문장 policy (contracts
      // doc §분량) — a tuning input, never a validation gate.
      body_sentences_approx: body.split(/[.!?…]\s+|\n+/).filter((s) => s.trim()).length,
    };
  },

  dryRunPayload() {
    return {
      facts: ['(dry-run) 객관 기록 행 자리.'],
      report_body: '(dry-run) 무전 상황 보고 본문 자리.',
    };
  },
};

export const CALL_TYPES = { judgment, narration, reporter };


/** Problems prefixed __soft__ are recorded but do not trigger a retry. */
export const isSoft = (p) => p.startsWith('__soft__');
export const stripSoft = (p) => p.replace(/^__soft__\s*/, '');
