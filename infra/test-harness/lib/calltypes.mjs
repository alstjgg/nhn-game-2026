// Call-type registry — the extensibility seam of this harness.
//
// A test type is a (call type × suite) pair. The suite is data; the call type is
// an entry here. Adding a future test type means adding one entry below plus a
// templates/<dir>/ — the runner, arm-diff check, recorder, and CLI are untouched.
//
// Each entry declares:
//   templateDir  which templates/<dir> holds base-*.md / user-*.md
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
  templateDir: 'judgment',
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
            description: '실제로 입에서 나가는 말. 한두 문장.',
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
    if (!ids.includes(input.rejected_stance)) problems.push('rejected_stance not in stance set');
    else if (input.rejected_stance === input.stance) problems.push('rejected_stance equals stance');
    if (!input.rejected_reason?.trim()) problems.push('rejected_reason empty');
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
    return {
      stance: input.stance,
      because_referent: input.because_referent ?? null,
      because_block_ids: cited,
      because_invalid_ids: cited.filter((id) => !legalBlocks.has(id)),
      rejected_stance: input.rejected_stance ?? null,
      utterance_chars: (input.utterance ?? '').length,
      inner_note_chars: (input.inner_note ?? '').length,
    };
  },
};

// Declared, not yet exercised. The reporter call emits prose, so it has no tool
// and its "validation" is structural (sections present, no invented facts is a
// human check). Wire it when E-CONT screening needs the report leg.
const reporter = {
  templateDir: 'reporter',
  slots: ['TEMPERAMENT', 'EXPERIENCED'],
  buildTool: () => null,
  validate: (text) => (String(text ?? '').trim() ? [] : ['empty report body']),
  summarize: (text) => ({ body_chars: String(text ?? '').length }),
};

export const CALL_TYPES = { judgment, reporter };

/**
 * Slots a probe of a given kind is permitted to vary. Mirrors deep-test plan
 * §7.2 — anything not listed here is frozen and diff-verified across arms.
 */
export const CHANNEL_SLOTS = {
  // Player channels (§4.1) — what the mechanism program is about.
  'C-BLOCK': ['BLOCKS'],
  'C-STRUCT': ['PRIORITY_LIST'],
  // Contingency arm carried on the C-BLOCK pre-registration sheet (§4.1).
  CREDULITY: ['FLAW'],
  // D task (agent prompt test) — NOT player channels. Temperament is a fixture
  // in the mechanism program and must be byte-identical across a probe's arms,
  // so a mechanism suite must never declare these; the diff check is what
  // catches a temperament swap smuggled into a C-BLOCK probe.
  'D-TEMP': ['TEMPERAMENT'],
  'D-INCIDENT': ['INCIDENT'],
  // Shape work legitimately varies nothing in the payload across arms.
  SHAPE: [],
};

/** Problems prefixed __soft__ are recorded but do not trigger a retry. */
export const isSoft = (p) => p.startsWith('__soft__');
export const stripSoft = (p) => p.replace(/^__soft__\s*/, '');
