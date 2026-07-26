// Council harness — mounts the 평의회 tile once, on REAL data.
//
// The pool, the agenda, the options and the payout are exactly what ships: the spec can
// assert WIRING (one call per unit, the revealed hint, the flipped stance, the emitted
// grant) without ever naming a Korean string.
//
//   ?agenda=riddle_golem | fallen_merchant   default: riddle_golem
//   ?equip=<unitId>:<cardId>                 repeatable — seeds one card on one unit
//
// The round is HELD until `window.__council.start()` is called. That is the only way to
// prove the 「번역 렌즈」 hint is on screen BEFORE the vote without racing a timer, and it
// is a harness affordance, never a player control: nothing in the DOM invokes it, and
// `start` is defined non-enumerably so the published fixture stays plain data.

import decisionsRaw from '../../../data/decisions.json';
import type { AIAdapter } from '../../../src/ai/adapter';
import { bucketConfigOf } from '../../../src/ai/bucket';
import type { BucketConfig } from '../../../src/ai/bucket';
import type { StanceRequest, ValidationCtx } from '../../../src/ai/contract';
import { createStubAdapter } from '../../../src/ai/stub';
import { buildStancePool } from '../../../src/council/pool';
import { COUNCIL_GRANT_EVENT } from '../../../src/council/outcome';
import type { CouncilGrantDetail, CouncilUnit } from '../../../src/council/types';
import { createTieBreaker } from '../../../src/core/tiebreak';
import { loadBundledGameData, resolveTuningRef } from '../../../src/data/loader';
import type { Agenda, Grant } from '../../../src/data/schema';
import { createCouncilScreen } from '../../../src/screens/council/index.ts';
import './harness.css';

const { cards, council, heroes, tuning } = loadBundledGameData();

/** The demo party of PRD §2.3, in party order. */
const PARTY_IDS = ['garrett', 'fiona', 'selene'];
const DEFAULT_AGENDA_ID = 'riddle_golem';

/** The council never computes a situation bucket; the stub still wants a shape-valid one. */
const BUCKET_CONFIG: BucketConfig = bucketConfigOf(tuning);

const params = new URLSearchParams(window.location.search);

const agendaId = params.get('agenda') ?? DEFAULT_AGENDA_ID;
const agenda: Agenda | undefined = council.agendas.find((entry) => entry.id === agendaId);
if (agenda === undefined) {
  throw new Error(`data/council.json carries no agenda '${agendaId}'`);
}

/** `?equip=selene:gambler`, repeatable. A typo is loud on purpose — this is a gate page. */
const equipped = new Map<string, string[]>();
for (const pair of params.getAll('equip')) {
  const [unitId, cardId] = pair.split(':');
  if (!unitId || !cardId) {
    throw new Error(`?equip expects <unitId>:<cardId>, got '${pair}'`);
  }
  if (!cards.some((card) => card.id === cardId)) {
    throw new Error(`data/cards.json carries no card '${cardId}'`);
  }
  equipped.set(unitId, [...(equipped.get(unitId) ?? []), cardId]);
}

const units: CouncilUnit[] = PARTY_IDS.map((unitId) => {
  const index = heroes.findIndex((hero) => hero.id === unitId);
  const hero = heroes[index];
  if (hero === undefined) {
    throw new Error(`harness party member '${unitId}' is missing from data/heroes.json`);
  }
  const cardIds = equipped.get(unitId) ?? [];
  return {
    id: hero.id,
    name: hero.name,
    index,
    stats: hero.stats,
    defaultPromptId: hero.defaultPrompt.id,
    equippedCardIds: cardIds,
    sheetIds: [hero.defaultPrompt.id, hero.baseSkill.id, ...cardIds],
  };
});

/** The tile reward PRD §2.5 authored for THIS agenda, found by its own wiring. */
const grant: Grant = Object.values(council.rewards).find(
  (reward): reward is Extract<Grant, { kind: 'conditional' }> =>
    reward.kind === 'conditional' && reward.on === agenda.id,
) ?? { kind: 'none' };

const stanceCalls: Array<{ unitId: string; agendaId: string; hintId: string | null }> = [];
const grants: CouncilGrantDetail[] = [];

const stub = createStubAdapter({
  pool: buildStancePool(decisionsRaw.council),
  latencyMs: resolveTuningRef(tuning, 'latency.unit'),
  timeoutMs: resolveTuningRef(tuning, 'timeout.stub'),
  bucketConfig: BUCKET_CONFIG,
});

/** The same stub, with every ask recorded — that is how "one round" becomes observable. */
const adapter: AIAdapter = {
  mode: stub.mode,
  decide: (req, ctx) => stub.decide(req, ctx),
  stance: (req: StanceRequest, ctx?: ValidationCtx) => {
    stanceCalls.push({
      unitId: req.unitId,
      agendaId: req.agendaId,
      hintId: req.hintId ?? null,
    });
    return stub.stance(req, ctx);
  },
};

const screen = createCouncilScreen({
  agenda,
  units,
  cards,
  adapter,
  tieBreaker: createTieBreaker({ policy: tuning.tieBreak.test }),
  grant,
  tuning,
});

// The screen pays out by announcing; the draft UI that consumes this belongs to u12.
screen.element.addEventListener(COUNCIL_GRANT_EVENT, (event) => {
  grants.push((event as CustomEvent<CouncilGrantDetail>).detail);
});

const root = document.getElementById('harness');
if (root) root.append(screen.element);

const fixture = {
  agendaId: agenda.id,
  unitIds: units.map((unit) => unit.id),
  optionIds: agenda.options.map((option) => option.id),
  answerOptionId: agenda.answerOptionId,
  stanceCalls,
  grants,
};
// Non-enumerable: the spec reads `window.__council` as a serialisable value, and a
// function-valued own key would have to cross that boundary too.
Object.defineProperty(fixture, 'start', {
  value: (): void => {
    screen.start();
  },
  enumerable: false,
});

Object.assign(window, { __council: fixture });
