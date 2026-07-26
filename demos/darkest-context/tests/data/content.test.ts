// u5 — authored stub-content gate (TDD-Red). Pure data checks over
// `data/decisions.json`; no DOM, no adapter, no timers (PRD §2.2, §2.4, §2.6, §2.9).
//
// Test-name filters used by the unit gates — these three words are load-bearing and each
// appears in EXACTLY ONE describe block in this file:
//   -t flips    → AC2 (the three authored card-variant entries)
//   -t because  → AC3 (INV-3: every attribution id resolves)
//   -t chatter  → AC4 (walk pool + tone bar)
//   (no filter) → AC1, the whole file
// Therefore the strings "flips", "because" and "chatter" must never appear in any other
// describe/it title here. Elsewhere they are spelled around ("attribution list",
// "card-variant entry", "walk pool").
//
// RED on arrival: `data/decisions.json` does not exist yet, so this module fails to
// resolve and every filtered run fails with it.
//
// ─── FILE SHAPE THIS GATE PINS (DESIGN was skipped for this unit; the test is the
//     authoring contract) ──────────────────────────────────────────────────────────
//   {
//     "combat":   [{ unitId, bucket, cardId: string|null, decision: {action, target?, say, because[]} }],
//     "council":  [{ unitId, agendaId, cardId: string|null, stance:   {action, say, because[]} }],
//     "chatter":  [{ id, lines: [{ unitId, text }, …] }],
//     "overload": [{ unitId, decision: {action, say, because[]} }]     // the fixed 100-tier bubble
//   }
//   · `cardId: null` is the default tier; a string is the card tier (PRD §2.2 lookup order).
//   · `target` is a SYMBOLIC selector (see SYMBOLIC_TARGETS) — canned content cannot know
//     runtime entity ids, so the stub adapter resolves the selector against the snapshot.
//   · `because` ids are sheet-item ids: the unit's own `defaultPrompt.id` / `baseSkill.id`
//     from `data/heroes.json`, plus the equipped card's id from `data/cards.json` — bare
//     ids, no `card.` prefix (the concept doc's §4.1 sample writes `card.grudge`; the ids
//     that actually ship are the ones in the data files, and INV-3 resolves against those).
import { describe, expect, it } from 'vitest';

import { isAgentDecision } from '../../src/ai/contract.ts';

import decisionsRaw from '../../data/decisions.json';
import heroesJson from '../../data/heroes.json';
import cardsJson from '../../data/cards.json';
import councilJson from '../../data/council.json';
import mapJson from '../../data/map.json';
import tuningJson from '../../data/tuning.json';

// ── the authored file, seen through the shape this gate pins ─────────────────
interface CannedDecision {
  action: string;
  target?: string;
  say: string;
  because: string[];
}
interface CombatEntry {
  unitId: string;
  bucket: string;
  cardId: string | null;
  decision: CannedDecision;
}
interface CouncilEntry {
  unitId: string;
  agendaId: string;
  cardId: string | null;
  stance: CannedDecision;
}
interface ChatterLine {
  unitId: string;
  text: string;
}
interface ChatterExchange {
  id: string;
  lines: ChatterLine[];
}
interface OverloadEntry {
  unitId: string;
  decision: CannedDecision;
}
interface DecisionsFile {
  combat: CombatEntry[];
  council: CouncilEntry[];
  chatter: ChatterExchange[];
  overload: OverloadEntry[];
}

const decisions = decisionsRaw as unknown as DecisionsFile;

// ── frozen vocabularies ──────────────────────────────────────────────────────

/** PRD §2.2 — the situation-bucket enum, frozen. */
const SITUATION_BUCKETS = [
  'opening',
  'ally_hurt',
  'self_hurt',
  'enemy_low',
  'gauge_noise',
  'default',
] as const;

/** PRD §2.3 — the party is fixed at three; 모데카이 is roster data only. */
const PARTY = ['garrett', 'fiona', 'selene'] as const;

/** PRD §2.5 — always offered, whatever is equipped. */
const BASE_ACTIONS = ['strike', 'defend', 'guard_ally'] as const;

/** Defensive/withholding actions — the shape 피오나's default judgment takes. */
const DEFENSIVE_ACTIONS = ['defend', 'wait', 'guard_ally', 'evade', 'analyze'] as const;

/** Canned targets are selectors the engine resolves, never live entity ids. */
const SYMBOLIC_TARGETS = [
  'self',
  'last_hit_by',
  'first_enemy',
  'lowest_hp_enemy',
  'highest_hp_enemy',
  'lowest_hp_ally',
  'first_ally',
  'phantom_enemy',
] as const;

/** Keys that would smuggle randomness into an authored pool (INV-6). */
const FORBIDDEN_KEYS = ['weight', 'weights', 'chance', 'probability', 'random', 'rng', 'seed'];

// ── indexes over the shipped data ────────────────────────────────────────────
const heroById = new Map(heroesJson.map((h) => [h.id, h] as const));
const cardById = new Map(cardsJson.map((c) => [c.id, c] as const));
const agendaById = new Map(councilJson.agendas.map((a) => [a.id, a] as const));
const CARD_IDS = cardsJson.map((c) => c.id);

/** Every id an authored line may cite (PRD §4-3): personas, base skills, cards. */
const SHEET_IDS: string[] = [
  ...heroesJson.map((h) => h.defaultPrompt.id),
  ...heroesJson.map((h) => h.baseSkill.id),
  ...CARD_IDS,
];

function cardActionId(cardId: string): string | null {
  const hook = cardById.get(cardId)?.engineHook as
    | { kind?: string; actionId?: string }
    | null
    | undefined;
  if (!hook || typeof hook.actionId !== 'string') return null;
  if (hook.kind !== 'combat_action' && hook.kind !== 'consumable_action') return null;
  return hook.actionId;
}

/** What a unit may pick at this tier: base actions + its 직업 기본 행동 + the card's own. */
function allowedActions(unitId: string, cardId: string | null): string[] {
  const out: string[] = [...BASE_ACTIONS];
  const hero = heroById.get(unitId);
  if (hero) out.push(hero.classDefaultAction);
  if (cardId !== null) {
    const registered = cardActionId(cardId);
    if (registered !== null) out.push(registered);
  }
  return out;
}

/** Which sheet items THIS entry is entitled to cite — a default tier holds no card. */
function citableIds(unitId: string, cardId: string | null): string[] {
  const hero = heroById.get(unitId);
  const out: string[] = hero ? [hero.defaultPrompt.id, hero.baseSkill.id] : [];
  if (cardId !== null) out.push(cardId);
  return out;
}

/** PRD §2.2 lookup order: (unit,bucket,card) → (unit,bucket) → (unit,"default"). */
function lookup(unitId: string, bucket: string, cardId: string | null): CombatEntry | undefined {
  const cardTier =
    cardId === null
      ? undefined
      : decisions.combat.find(
          (e) => e.unitId === unitId && e.bucket === bucket && e.cardId === cardId,
        );
  return (
    cardTier ??
    decisions.combat.find((e) => e.unitId === unitId && e.bucket === bucket && e.cardId === null) ??
    decisions.combat.find(
      (e) => e.unitId === unitId && e.bucket === 'default' && e.cardId === null,
    )
  );
}

function defaultTier(unitId: string, bucket: string): CombatEntry | undefined {
  return decisions.combat.find(
    (e) => e.unitId === unitId && e.bucket === bucket && e.cardId === null,
  );
}

function collectKeys(value: unknown, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, out);
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      collectKeys(v, out);
    }
  }
}

/**
 * The tone bar of the concept doc's §4.1 walkthrough, as far as a machine can hold it
 * (PRD §2.9): in-character Korean · one sentence · no translationese. The 당신 check is a
 * proxy — it is the canonical translationese pronoun in Korean game dialogue; party
 * members address each other by name or 너.
 */
function toneProblems(text: unknown): string[] {
  if (typeof text !== 'string' || text.trim().length === 0) return ['empty or not a string'];
  const problems: string[] = [];
  if (!/[가-힣]/.test(text)) problems.push('carries no Korean');
  if (/[A-Za-z]/.test(text)) problems.push('leaks Latin letters into display text');
  if ((text.match(/[.!?](?=\s|$)/g) ?? []).length > 1) problems.push('runs past one sentence');
  if (text.includes('당신')) problems.push('uses the translationese pronoun 당신');
  if ([...text].length > 60) problems.push('runs past 60 characters');
  return problems;
}

function expectTone(label: string, text: unknown): void {
  expect(toneProblems(text), `${label}: ${JSON.stringify(text)}`).toEqual([]);
}

const cardTierCombat = () => decisions.combat.filter((e) => e.cardId !== null);
const cardTierCouncil = () => decisions.council.filter((e) => e.cardId !== null);

// ═════════════════════════════════════════════════════════════════════════════

describe('decisions.json — the authored stub pool', () => {
  // ── AC1 — coverage: no (unit × context) combination dead-ends ──────────────
  describe('coverage of every unit and every situation', () => {
    it('ships the four authored sections as non-empty arrays', () => {
      for (const key of ['combat', 'council', 'chatter', 'overload'] as const) {
        expect(Array.isArray(decisions[key]), `${key} must be an array`).toBe(true);
        expect(decisions[key].length, `${key} must not be empty`).toBeGreaterThan(0);
      }
    });

    it('keys every combat entry by a real hero id and a frozen situation bucket', () => {
      for (const e of decisions.combat) {
        expect(heroById.has(e.unitId), `unknown unit ${e.unitId}`).toBe(true);
        expect(SITUATION_BUCKETS as readonly string[]).toContain(e.bucket);
        expect(
          e.cardId === null || cardById.has(e.cardId),
          `unknown card ${String(e.cardId)}`,
        ).toBe(true);
      }
    });

    it('gives each of the three party units a default entry for all six buckets', () => {
      const missing: string[] = [];
      for (const unitId of PARTY) {
        for (const bucket of SITUATION_BUCKETS) {
          if (defaultTier(unitId, bucket) === undefined) missing.push(`${unitId}/${bucket}`);
        }
      }
      expect(missing).toEqual([]);
    });

    it('covers all six buckets for any extra unit it chooses to author', () => {
      const authoredUnits = [...new Set(decisions.combat.map((e) => e.unitId))];
      const partial: string[] = [];
      for (const unitId of authoredUnits) {
        for (const bucket of SITUATION_BUCKETS) {
          if (defaultTier(unitId, bucket) === undefined) partial.push(`${unitId}/${bucket}`);
        }
      }
      expect(partial).toEqual([]);
    });

    it('resolves the three-tier chain for every unit × bucket × equipped card', () => {
      const dead: string[] = [];
      for (const unitId of PARTY) {
        for (const bucket of SITUATION_BUCKETS) {
          for (const cardId of [null, ...CARD_IDS]) {
            if (lookup(unitId, bucket, cardId) === undefined) {
              dead.push(`${unitId}/${bucket}/${cardId ?? 'none'}`);
            }
          }
        }
      }
      expect(dead).toEqual([]);
    });

    it('never repeats a lookup key', () => {
      const combatKeys = decisions.combat.map((e) => `${e.unitId}|${e.bucket}|${e.cardId ?? ''}`);
      expect(new Set(combatKeys).size).toBe(combatKeys.length);
      const councilKeys = decisions.council.map(
        (e) => `${e.unitId}|${e.agendaId}|${e.cardId ?? ''}`,
      );
      expect(new Set(councilKeys).size).toBe(councilKeys.length);
      const overloadUnits = decisions.overload.map((e) => e.unitId);
      expect(new Set(overloadUnits).size).toBe(overloadUnits.length);
    });

    it('passes every canned decision and stance through the shared schema gate', () => {
      for (const e of decisions.combat) {
        expect(isAgentDecision(e.decision), `combat ${e.unitId}/${e.bucket}`).toBe(true);
      }
      for (const e of decisions.council) {
        expect(isAgentDecision(e.stance), `council ${e.unitId}/${e.agendaId}`).toBe(true);
      }
      for (const e of decisions.overload) {
        expect(isAgentDecision(e.decision), `overload ${e.unitId}`).toBe(true);
      }
    });

    it('only picks actions the unit could actually take at that tier', () => {
      const illegal: string[] = [];
      for (const e of decisions.combat) {
        if (!allowedActions(e.unitId, e.cardId).includes(e.decision.action)) {
          illegal.push(`${e.unitId}/${e.bucket}/${e.cardId ?? 'none'} → ${e.decision.action}`);
        }
      }
      expect(illegal).toEqual([]);
    });

    it('names targets symbolically so no canned line points at a live entity id', () => {
      const bad: string[] = [];
      for (const e of decisions.combat) {
        const target = e.decision.target;
        if (target === undefined) continue;
        if (!(SYMBOLIC_TARGETS as readonly string[]).includes(target)) {
          bad.push(`${e.unitId}/${e.bucket}/${e.cardId ?? 'none'} → ${target}`);
        }
      }
      expect(bad).toEqual([]);
    });

    it('gives each party unit a default stance on every council agenda', () => {
      const missing: string[] = [];
      for (const unitId of PARTY) {
        for (const agenda of councilJson.agendas) {
          const hit = decisions.council.find(
            (e) => e.unitId === unitId && e.agendaId === agenda.id && e.cardId === null,
          );
          if (hit === undefined) missing.push(`${unitId}/${agenda.id}`);
        }
      }
      expect(missing).toEqual([]);
    });

    it('votes only for enumerated options of the agenda it is keyed to', () => {
      for (const e of decisions.council) {
        const agenda = agendaById.get(e.agendaId);
        expect(agenda, `unknown agenda ${e.agendaId}`).toBeDefined();
        const optionIds = agenda!.options.map((o) => o.id);
        expect(optionIds, `${e.unitId}/${e.agendaId}`).toContain(e.stance.action);
      }
    });

    it('forces the 직업 기본 행동 in every 100-tier entry, one per party unit', () => {
      for (const unitId of PARTY) {
        const entry = decisions.overload.find((e) => e.unitId === unitId);
        expect(entry, `no 100-tier entry for ${unitId}`).toBeDefined();
        expect(entry!.decision.action).toBe(heroById.get(unitId)!.classDefaultAction);
      }
    });

    it('carries no weighting or seed key anywhere in the authored file', () => {
      const keys = new Set<string>();
      collectKeys(decisionsRaw, keys);
      expect([...keys].filter((k) => FORBIDDEN_KEYS.includes(k))).toEqual([]);
    });
  });

  // ── AC2 — the three authored card-variant flips ────────────────────────────
  describe('card-variant flips', () => {
    it('turns 피오나 from shield-hugger into the first to charge under 「겁이 없다」', () => {
      const variants = decisions.combat.filter(
        (e) => e.unitId === 'fiona' && e.cardId === 'fearless',
      );
      expect(variants.length, 'no fiona × fearless card-tier entry').toBeGreaterThan(0);
      for (const v of variants) {
        const base = defaultTier('fiona', v.bucket);
        expect(base, `no fiona default for ${v.bucket}`).toBeDefined();
        expect(DEFENSIVE_ACTIONS as readonly string[]).toContain(base!.decision.action);
        expect(v.decision.action, `fiona/${v.bucket} under 「겁이 없다」`).toBe('strike');
      }
    });

    it('retargets 가렛 onto last_hit_by under 「원한」', () => {
      const variants = decisions.combat.filter(
        (e) => e.unitId === 'garrett' && e.cardId === 'grudge',
      );
      expect(variants.length, 'no garrett × grudge card-tier entry').toBeGreaterThan(0);
      const retargeted = variants.filter((v) => v.decision.target === 'last_hit_by');
      expect(retargeted.length, 'no grudge entry targets last_hit_by').toBeGreaterThan(0);
      for (const v of retargeted) {
        const base = defaultTier('garrett', v.bucket);
        expect(base, `no garrett default for ${v.bucket}`).toBeDefined();
        expect(base!.decision.target, `garrett/${v.bucket} default`).not.toBe('last_hit_by');
      }
    });

    it('flips 셀레네 off her own merchant vote under 「승부사」', () => {
      const variant = decisions.council.find(
        (e) =>
          e.unitId === 'selene' && e.agendaId === 'fallen_merchant' && e.cardId === 'gambler',
      );
      expect(variant, 'no selene × gambler stance on 쓰러진 상인').toBeDefined();
      const base = decisions.council.find(
        (e) => e.unitId === 'selene' && e.agendaId === 'fallen_merchant' && e.cardId === null,
      );
      expect(base, 'no selene default stance on 쓰러진 상인').toBeDefined();
      expect(variant!.stance.action).not.toBe(base!.stance.action);
    });

    it('keys every card-tier entry to a real card and cites it in the attribution list', () => {
      const entries = [
        ...cardTierCombat().map((e) => ({ key: `${e.unitId}/${e.bucket}`, e, d: e.decision })),
        ...cardTierCouncil().map((e) => ({ key: `${e.unitId}/${e.agendaId}`, e, d: e.stance })),
      ];
      expect(entries.length, 'the pool authors no card-tier entry at all').toBeGreaterThanOrEqual(
        3,
      );
      for (const { key, e, d } of entries) {
        expect(cardById.has(e.cardId!), `${key} → unknown card ${String(e.cardId)}`).toBe(true);
        expect(d.because, `${key} does not cite ${String(e.cardId)}`).toContain(e.cardId);
      }
    });
  });

  // ── AC3 — INV-3: attribution ids resolve ──────────────────────────────────
  describe('attribution — every because id resolves to a sheet item', () => {
    it('resolves every combat because id against heroes.json and cards.json', () => {
      const unresolved: string[] = [];
      for (const e of decisions.combat) {
        for (const id of e.decision.because) {
          if (!SHEET_IDS.includes(id)) unresolved.push(`${e.unitId}/${e.bucket} → ${id}`);
        }
      }
      expect(unresolved).toEqual([]);
    });

    it('resolves every council and 100-tier because id against the same namespace', () => {
      const unresolved: string[] = [];
      for (const e of decisions.council) {
        for (const id of e.stance.because) {
          if (!SHEET_IDS.includes(id)) unresolved.push(`${e.unitId}/${e.agendaId} → ${id}`);
        }
      }
      for (const e of decisions.overload) {
        for (const id of e.decision.because) {
          if (!SHEET_IDS.includes(id)) unresolved.push(`${e.unitId}/overload → ${id}`);
        }
      }
      expect(unresolved).toEqual([]);
    });

    it('cites only sheet items that entry actually holds — a default tier cites no card', () => {
      const outOfScope: string[] = [];
      const check = (label: string, unitId: string, cardId: string | null, because: string[]) => {
        const allowed = citableIds(unitId, cardId);
        for (const id of because) if (!allowed.includes(id)) outOfScope.push(`${label} → ${id}`);
      };
      for (const e of decisions.combat) {
        check(`${e.unitId}/${e.bucket}/${e.cardId ?? 'none'}`, e.unitId, e.cardId, e.decision.because);
      }
      for (const e of decisions.council) {
        check(
          `${e.unitId}/${e.agendaId}/${e.cardId ?? 'none'}`,
          e.unitId,
          e.cardId,
          e.stance.because,
        );
      }
      for (const e of decisions.overload) {
        check(`${e.unitId}/overload`, e.unitId, null, e.decision.because);
      }
      expect(outOfScope).toEqual([]);
    });

    it('fails the shared validator when an id is not on any sheet', () => {
      const sample = decisions.combat[0].decision;
      expect(isAgentDecision(sample, { sheetIds: SHEET_IDS })).toBe(true);
      expect(
        isAgentDecision({ ...sample, because: ['no_such_sheet_item'] }, { sheetIds: SHEET_IDS }),
      ).toBe(false);
    });
  });

  // ── AC4 — the walk pool, the noise variants, the 100-tier line ─────────────
  describe('chatter', () => {
    it('carries at least 12 exchanges, each a real back-and-forth between party units', () => {
      expect(decisions.chatter.length).toBeGreaterThanOrEqual(12);
      for (const ex of decisions.chatter) {
        expect(typeof ex.id, `exchange id ${String(ex.id)}`).toBe('string');
        expect(Array.isArray(ex.lines), `${ex.id} lines`).toBe(true);
        expect(ex.lines.length, `${ex.id} is not an exchange`).toBeGreaterThanOrEqual(2);
        const speakers = new Set(ex.lines.map((l) => l.unitId));
        expect(speakers.size, `${ex.id} is a monologue`).toBeGreaterThanOrEqual(2);
        for (const line of ex.lines) {
          expect(PARTY as readonly string[], `${ex.id} speaker`).toContain(line.unitId);
        }
      }
    });

    it('keeps exchange ids unique so the pool is addressable by position', () => {
      const ids = decisions.chatter.map((ex) => ex.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('addresses a stable, distinct window from every tile index — no randomness', () => {
      const perWalk = tuningJson.chatter.maxPerWalk;
      const pool = decisions.chatter;
      expect(pool.length).toBeGreaterThanOrEqual(perWalk);
      const windowFor = (tileIndex: number): string[] =>
        Array.from({ length: perWalk }, (_, k) => pool[(tileIndex * perWalk + k) % pool.length].id);
      for (let i = 0; i < mapJson.tiles.length; i += 1) {
        const first = windowFor(i);
        expect(first, `tile ${i} repeats an exchange inside one walk`).toHaveLength(
          new Set(first).size,
        );
        expect(windowFor(i), `tile ${i} is not deterministic`).toEqual(first);
        expect(first.length).toBeGreaterThanOrEqual(tuningJson.chatter.minPerWalk);
      }
    });

    it('writes a distinct gauge_noise line per party unit — distorted judgment, not an error', () => {
      for (const unitId of PARTY) {
        const noise = defaultTier(unitId, 'gauge_noise');
        expect(noise, `no gauge_noise entry for ${unitId}`).toBeDefined();
        const plain = defaultTier(unitId, 'default');
        expect(noise!.decision.say, `${unitId} gauge_noise reads like the plain line`).not.toBe(
          plain!.decision.say,
        );
        expect(noise!.decision.say.length, `${unitId} gauge_noise line is empty`).toBeGreaterThan(0);
      }
    });

    it('writes the fixed 100-tier bubble line for every party unit', () => {
      for (const unitId of PARTY) {
        const entry = decisions.overload.find((e) => e.unitId === unitId);
        expect(entry, `no 100-tier line for ${unitId}`).toBeDefined();
        expectTone(`${unitId} 100-tier bubble`, entry!.decision.say);
      }
    });

    it('holds every authored line to one in-character Korean sentence', () => {
      for (const e of decisions.combat) {
        expectTone(`combat ${e.unitId}/${e.bucket}/${e.cardId ?? 'none'}`, e.decision.say);
      }
      for (const e of decisions.council) {
        expectTone(`council ${e.unitId}/${e.agendaId}/${e.cardId ?? 'none'}`, e.stance.say);
      }
      for (const ex of decisions.chatter) {
        for (const [i, line] of ex.lines.entries()) {
          expectTone(`${ex.id} line ${i} (${line.unitId})`, line.text);
        }
      }
    });
  });
});
