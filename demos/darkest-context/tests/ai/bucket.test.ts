// u6 — situation bucket keying + the 3-tier lookup cascade (TDD-Red).
// Covers AC2a (frozen enum) · AC2b (determinism + one row per member) ·
// AC2c (card → bucket → default cascade, all three tiers proven) ·
// AC2d (an invalid entry is a MISS and the cascade continues, silently).
//
// PRD §2.2: the engine computes a deterministic situation bucket out of the
// frozen set `opening | ally_hurt | self_hurt | enemy_low | gauge_noise |
// default`, then looks up `(unitId, bucket, equippedCardId)` →
// `(unitId, bucket)` → `(unitId, 'default')` in the canned decision pool.
//
// `data/decisions.json` is authored by a parallel unit, so every pool here is an
// inline fixture: this file pins the SHAPE, not the shipped content.
import { describe, expect, it } from 'vitest';
import { isAgentDecision } from '../../src/ai/contract.ts';
import type {
  AgentDecision,
  EntityView,
  SituationSnapshot,
  Stance,
  ValidationCtx,
} from '../../src/ai/contract.ts';
import {
  DEFAULT_KEY,
  SITUATION_BUCKETS,
  bucketConfigOf,
  computeBucket,
  lookupDecision,
  lookupStance,
} from '../../src/ai/bucket.ts';
import type { BucketConfig, DecisionPool, SituationBucket } from '../../src/ai/bucket.ts';
import { loadBundledGameData } from '../../src/data/loader.ts';

// ── fixtures ────────────────────────────────────────────────────────────────
// The thresholds come from `data/tuning.json`, the file that owns them: `BucketConfig`
// is a REQUIRED parameter (no src file may inline a tunable), and a private copy here
// would grade the cascade against a number the shipped run does not use (INV-8).
const CFG: BucketConfig = bucketConfigOf(loadBundledGameData().tuning);

const LATER_TURN = 4;

const entity = (id: string, hp: number, hpMax: number, alive = true): EntityView => ({
  id,
  name: id,
  hp,
  hpMax,
  alive,
});

const healthy = (id: string): EntityView => entity(id, 10, 10);
const hurt = (id: string): EntityView => entity(id, 2, 10);

function snapshot(over: Partial<SituationSnapshot> = {}): SituationSnapshot {
  return {
    turn: LATER_TURN,
    self: { ...healthy('garrett'), gaugeTier: 0 },
    allies: [healthy('fiona'), healthy('selene')],
    enemies: [healthy('golem'), healthy('wisp')],
    availableActions: [
      { id: 'strike', label: '공격', needsTarget: true },
      { id: 'defend', label: '방어', needsTarget: false },
    ],
    corrupted: false,
    ...over,
  };
}

const decision = (action: string, because = ['garrett.default']): AgentDecision => ({
  action,
  say: `${action} 한다.`,
  because,
});

const CARD_ID = 'mirror_shield';
const OTHER_CARD_ID = 'flame_scroll';
const UNEQUIPPED_CARD_ID = 'healing_potion_x3';

const CARD_HIT = decision('reflect');
const BUCKET_HIT = decision('protect');
const DEFAULT_HIT = decision('defend');

/** A pool wired for all three tiers of one unit. */
function fullPool(): DecisionPool {
  return {
    decisions: {
      garrett: {
        ally_hurt: { [CARD_ID]: CARD_HIT, [DEFAULT_KEY]: BUCKET_HIT },
        default: { [DEFAULT_KEY]: DEFAULT_HIT },
      },
    },
  };
}

// ══════════════════════════ AC2a — the enum is frozen ═══════════════════════

describe('AC2a — the situation bucket set is frozen to exactly six members', () => {
  const EXPECTED = [
    'opening',
    'ally_hurt',
    'self_hurt',
    'enemy_low',
    'gauge_noise',
    'default',
  ] as const;

  it('exports the six PRD members, in the PRD order, with nothing extra', () => {
    expect([...SITUATION_BUCKETS]).toEqual([...EXPECTED]);
  });

  it('has exactly six members and no duplicate', () => {
    expect(SITUATION_BUCKETS).toHaveLength(EXPECTED.length);
    expect(new Set(SITUATION_BUCKETS).size).toBe(EXPECTED.length);
  });

  it('every declared member is reachable as a computeBucket result type', () => {
    // Compile-time arm: assigning each literal to SituationBucket must typecheck.
    const reachable: SituationBucket[] = [...EXPECTED];
    expect(reachable.every((b) => SITUATION_BUCKETS.includes(b))).toBe(true);
  });
});

// ══════════════════ AC2b — one row per member + determinism ═════════════════

describe('AC2b — computeBucket maps each situation to its frozen member', () => {
  const rows: ReadonlyArray<{ name: SituationBucket; snap: () => SituationSnapshot }> = [
    {
      name: 'gauge_noise',
      snap: () => snapshot({ corrupted: true }),
    },
    {
      name: 'opening',
      snap: () => snapshot({ turn: CFG.openingTurn }),
    },
    {
      name: 'self_hurt',
      snap: () => snapshot({ self: { ...hurt('garrett'), gaugeTier: 0 } }),
    },
    {
      name: 'ally_hurt',
      snap: () => snapshot({ allies: [healthy('fiona'), hurt('selene')] }),
    },
    {
      name: 'enemy_low',
      snap: () => snapshot({ enemies: [healthy('golem'), entity('wisp', 2, 10)] }),
    },
    {
      name: 'default',
      snap: () => snapshot(),
    },
  ];

  for (const row of rows) {
    it(`returns '${row.name}' for its canonical situation`, () => {
      expect(computeBucket(row.snap(), CFG)).toBe(row.name);
    });
  }

  it('covers every member of the frozen set — no member is unreachable', () => {
    const produced = new Set(rows.map((r) => computeBucket(r.snap(), CFG)));
    expect([...produced].sort()).toEqual([...SITUATION_BUCKETS].sort());
  });

  it('is deterministic: the same snapshot yields the same bucket over 100 repeats', () => {
    for (const row of rows) {
      const snap = row.snap();
      const results = new Set(Array.from({ length: 100 }, () => computeBucket(snap, CFG)));
      expect([...results]).toEqual([row.name]);
    }
  });

  it('is pure: the snapshot it was handed comes back unmutated', () => {
    const snap = snapshot({ allies: [hurt('fiona')] });
    const before = structuredClone(snap);
    computeBucket(snap, CFG);
    expect(snap).toEqual(before);
  });
});

describe('AC2b — bucket precedence is frozen', () => {
  it('gauge_noise outranks opening (a corrupted first turn is noise)', () => {
    expect(computeBucket(snapshot({ corrupted: true, turn: CFG.openingTurn }), CFG)).toBe(
      'gauge_noise',
    );
  });

  it('gauge_noise outranks every damage bucket at once', () => {
    const snap = snapshot({
      corrupted: true,
      turn: CFG.openingTurn,
      self: { ...hurt('garrett'), gaugeTier: 3 },
      allies: [hurt('fiona')],
      enemies: [entity('golem', 1, 10)],
    });
    expect(computeBucket(snap, CFG)).toBe('gauge_noise');
  });

  it('opening outranks self_hurt', () => {
    const snap = snapshot({ turn: CFG.openingTurn, self: { ...hurt('garrett'), gaugeTier: 0 } });
    expect(computeBucket(snap, CFG)).toBe('opening');
  });

  it('self_hurt outranks ally_hurt', () => {
    const snap = snapshot({
      self: { ...hurt('garrett'), gaugeTier: 0 },
      allies: [hurt('fiona')],
    });
    expect(computeBucket(snap, CFG)).toBe('self_hurt');
  });

  it('ally_hurt outranks enemy_low', () => {
    const snap = snapshot({
      allies: [hurt('fiona')],
      enemies: [entity('golem', 1, 10)],
    });
    expect(computeBucket(snap, CFG)).toBe('ally_hurt');
  });
});

describe('AC2b — computeBucket is total: no snapshot can dead-end or divide by zero', () => {
  it('treats a dead ally below the ratio as not hurt (only the living count)', () => {
    const snap = snapshot({ allies: [entity('fiona', 0, 10, false)] });
    expect(computeBucket(snap, CFG)).toBe('default');
  });

  it('treats a dead low-HP enemy as not low (only the living count)', () => {
    const snap = snapshot({ enemies: [entity('golem', 0, 10, false)] });
    expect(computeBucket(snap, CFG)).toBe('default');
  });

  it('never divides by zero: a non-positive hpMax is not "hurt"', () => {
    const snap = snapshot({ allies: [entity('fiona', 0, 0)], enemies: [entity('golem', 0, 0)] });
    expect(computeBucket(snap, CFG)).toBe('default');
  });

  it('empty ally and enemy rosters resolve to default, not a crash', () => {
    expect(computeBucket(snapshot({ allies: [], enemies: [] }), CFG)).toBe('default');
  });

  it('roster order never changes the result (any-match, not first-match)', () => {
    const a = snapshot({ allies: [healthy('fiona'), hurt('selene')] });
    const b = snapshot({ allies: [hurt('selene'), healthy('fiona')] });
    expect(computeBucket(a, CFG)).toBe(computeBucket(b, CFG));
    expect(computeBucket(a, CFG)).toBe('ally_hurt');
  });

  it('the threshold is strictly-below: a ratio exactly at hurtBelowRatio is not hurt', () => {
    const atRatio = entity('fiona', 10 * CFG.hurtBelowRatio, 10);
    expect(computeBucket(snapshot({ allies: [atRatio] }), CFG)).toBe('default');
  });

  it('the enemy threshold is strictly-below too', () => {
    const atRatio = entity('golem', 10 * CFG.enemyLowBelowRatio, 10);
    expect(computeBucket(snapshot({ enemies: [atRatio] }), CFG)).toBe('default');
  });

  it('a turn before the opening turn still buckets as opening', () => {
    expect(computeBucket(snapshot({ turn: 0 }), CFG)).toBe('opening');
  });

  it('the turn after the opening turn is no longer opening', () => {
    expect(computeBucket(snapshot({ turn: CFG.openingTurn + 1 }), CFG)).toBe('default');
  });
});

// ═════════════ AC2c — the three-tier cascade, every step proven ═════════════

describe('AC2c — lookupDecision resolves card → bucket → default', () => {
  it("exposes '_' as the in-bucket default key", () => {
    expect(DEFAULT_KEY).toBe('_');
  });

  it("tier 1: an equipped card with an authored entry wins and reports tier 'card'", () => {
    const hit = lookupDecision(fullPool(), 'garrett', 'ally_hurt', [CARD_ID]);
    expect(hit).not.toBeNull();
    expect(hit?.value).toEqual(CARD_HIT);
    expect(hit?.tier).toBe('card');
    expect(hit?.key).toContain(CARD_ID);
    expect(hit?.key).toContain('garrett');
    expect(hit?.key).toContain('ally_hurt');
  });

  it("tier 2: no card entry ⇒ the bucket default answers and reports tier 'bucket'", () => {
    const hit = lookupDecision(fullPool(), 'garrett', 'ally_hurt', [UNEQUIPPED_CARD_ID]);
    expect(hit?.value).toEqual(BUCKET_HIT);
    expect(hit?.tier).toBe('bucket');
    expect(hit?.key).toContain('ally_hurt');
    expect(hit?.key).toContain(DEFAULT_KEY);
  });

  it("tier 3: no bucket at all ⇒ the unit default answers and reports tier 'default'", () => {
    // The AC2c pool: ONLY (unitId, 'default') is authored.
    const pool: DecisionPool = {
      decisions: { garrett: { default: { [DEFAULT_KEY]: DEFAULT_HIT } } },
    };
    const hit = lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID]);
    expect(hit?.value).toEqual(DEFAULT_HIT);
    expect(hit?.tier).toBe('default');
    expect(hit?.key).toContain('garrett');
    expect(hit?.key).toContain('default');
  });

  it('the miss-cascade is real: with no equipped cards the card tier is skipped entirely', () => {
    const hit = lookupDecision(fullPool(), 'garrett', 'ally_hurt', []);
    expect(hit?.tier).toBe('bucket');
    expect(hit?.value).toEqual(BUCKET_HIT);
  });

  it('walks equipped cards in the caller-supplied slot order — first hit wins', () => {
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          ally_hurt: {
            [CARD_ID]: CARD_HIT,
            [OTHER_CARD_ID]: decision('burn'),
            [DEFAULT_KEY]: BUCKET_HIT,
          },
          default: { [DEFAULT_KEY]: DEFAULT_HIT },
        },
      },
    };
    expect(lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID, OTHER_CARD_ID])?.value).toEqual(
      CARD_HIT,
    );
    expect(lookupDecision(pool, 'garrett', 'ally_hurt', [OTHER_CARD_ID, CARD_ID])?.value).toEqual(
      decision('burn'),
    );
  });

  it('an unknown unit resolves null instead of throwing (silent miss)', () => {
    expect(lookupDecision(fullPool(), 'nobody', 'ally_hurt', [CARD_ID])).toBeNull();
  });

  it('a unit with no default entry and no matching bucket resolves null', () => {
    const pool: DecisionPool = {
      decisions: { garrett: { ally_hurt: { [CARD_ID]: CARD_HIT } } },
    };
    expect(lookupDecision(pool, 'garrett', 'self_hurt', [])).toBeNull();
  });

  it('is pure: the pool it was handed comes back unmutated', () => {
    const pool = fullPool();
    const before = structuredClone(pool);
    lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID]);
    lookupDecision(pool, 'nobody', 'default', []);
    expect(pool).toEqual(before);
  });

  it('every hit it returns already satisfies the shared validator', () => {
    for (const cards of [[CARD_ID], [UNEQUIPPED_CARD_ID]]) {
      const hit = lookupDecision(fullPool(), 'garrett', 'ally_hurt', cards);
      expect(isAgentDecision(hit?.value)).toBe(true);
    }
  });
});

// ═════ AC2d — an invalid entry is a MISS; the cascade continues, silently ════

describe('AC2d — a malformed entry is skipped and the next tier answers', () => {
  const MALFORMED = { action: '', say: '', because: [] } as unknown;

  it('an invalid card-tier entry falls through to the bucket tier', () => {
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          ally_hurt: { [CARD_ID]: MALFORMED, [DEFAULT_KEY]: BUCKET_HIT },
          default: { [DEFAULT_KEY]: DEFAULT_HIT },
        },
      },
    };
    const hit = lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID]);
    expect(hit?.tier).toBe('bucket');
    expect(hit?.value).toEqual(BUCKET_HIT);
  });

  it('invalid at BOTH card and bucket tiers ⇒ the unit default answers', () => {
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          ally_hurt: { [CARD_ID]: MALFORMED, [DEFAULT_KEY]: MALFORMED },
          default: { [DEFAULT_KEY]: DEFAULT_HIT },
        },
      },
    };
    const hit = lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID]);
    expect(hit?.tier).toBe('default');
    expect(hit?.value).toEqual(DEFAULT_HIT);
  });

  it('an entry missing `because` is a miss (INV-3: every decision is attributable)', () => {
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          ally_hurt: { [DEFAULT_KEY]: { action: 'defend', say: '막는다.' } },
          default: { [DEFAULT_KEY]: DEFAULT_HIT },
        },
      },
    };
    expect(lookupDecision(pool, 'garrett', 'ally_hurt', [])?.tier).toBe('default');
  });

  it('an unresolvable `because` id is a miss when a ValidationCtx is supplied', () => {
    const ctx: ValidationCtx = { sheetIds: ['garrett.default'] };
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          ally_hurt: { [DEFAULT_KEY]: decision('protect', ['ghost.card']) },
          default: { [DEFAULT_KEY]: DEFAULT_HIT },
        },
      },
    };
    expect(lookupDecision(pool, 'garrett', 'ally_hurt', [], ctx)?.tier).toBe('default');
    // …and without a ctx the same entry is a legitimate tier-2 hit (authoring mode).
    expect(lookupDecision(pool, 'garrett', 'ally_hurt', [])?.tier).toBe('bucket');
  });

  it('every tier invalid ⇒ null, never a throw and never a synthesised answer', () => {
    const pool: DecisionPool = {
      decisions: {
        garrett: {
          ally_hurt: { [CARD_ID]: MALFORMED, [DEFAULT_KEY]: MALFORMED },
          default: { [DEFAULT_KEY]: MALFORMED },
        },
      },
    };
    expect(() => lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID])).not.toThrow();
    expect(lookupDecision(pool, 'garrett', 'ally_hurt', [CARD_ID])).toBeNull();
  });
});

// ═══════════════ AC2c/AC2d — the council half uses the same cascade ═════════

describe('AC2c — lookupStance runs the same three-tier cascade over agendas', () => {
  const AGENDA = 'ration_split';
  const STANCE_CARD: Stance = { action: 'opt_a', say: '나눈다.', because: ['garrett.default'] };
  const STANCE_AGENDA: Stance = { action: 'opt_b', say: '아낀다.', because: ['garrett.default'] };
  const STANCE_DEFAULT: Stance = { action: 'opt_c', say: '기권한다.', because: ['garrett.default'] };

  const stancePool = (): DecisionPool => ({
    decisions: { garrett: { default: { [DEFAULT_KEY]: DEFAULT_HIT } } },
    stances: {
      garrett: {
        [AGENDA]: { [CARD_ID]: STANCE_CARD, [DEFAULT_KEY]: STANCE_AGENDA },
        default: { [DEFAULT_KEY]: STANCE_DEFAULT },
      },
    },
  });

  it("tier 'card': an equipped card entry under the agenda wins", () => {
    const hit = lookupStance(stancePool(), 'garrett', AGENDA, [CARD_ID]);
    expect(hit?.value).toEqual(STANCE_CARD);
    expect(hit?.tier).toBe('card');
  });

  it("tier 'bucket': the agenda default answers when no card matches", () => {
    const hit = lookupStance(stancePool(), 'garrett', AGENDA, [UNEQUIPPED_CARD_ID]);
    expect(hit?.value).toEqual(STANCE_AGENDA);
    expect(hit?.tier).toBe('bucket');
  });

  it("tier 'default': an unauthored agenda falls back to the unit default stance", () => {
    const hit = lookupStance(stancePool(), 'garrett', 'unknown_agenda', [CARD_ID]);
    expect(hit?.value).toEqual(STANCE_DEFAULT);
    expect(hit?.tier).toBe('default');
  });

  it('a pool with no stances section resolves null instead of throwing', () => {
    expect(lookupStance(fullPool(), 'garrett', AGENDA, [CARD_ID])).toBeNull();
  });

  it('a malformed stance is a miss and the cascade continues', () => {
    const pool = stancePool();
    (pool.stances as Record<string, Record<string, Record<string, unknown>>>).garrett[AGENDA][
      CARD_ID
    ] = { action: 'opt_a', say: '', because: [] };
    expect(lookupStance(pool, 'garrett', AGENDA, [CARD_ID])?.tier).toBe('bucket');
  });
});
