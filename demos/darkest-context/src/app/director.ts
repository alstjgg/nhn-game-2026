// u15 — the run director: one continuous playable run (PRD §2.4, §2.5).
//
// The FSM says WHERE the party is; `routes.ts` says WHICH screen plays that; this file
// is the only place the two meet. It owns exactly three things:
//
//   ① the mount slot — one screen at a time, always through the u1 registry;
//   ② the hand-backs the FSM waits on (`walkComplete` · `resolveTile` · `chooseBranch`),
//      every one of them enqueued rather than called from inside an emit (see
//      `task-queue.ts`);
//   ③ what a tile's result is worth: a victory's reward screen, a council's gauge hit,
//      a wipe.
//
// It arms no timer and rolls no dice (INV-6). A walk ends because the composition hands
// `walkComplete()` back, never because a clock said so — the declared walk budget rides
// on the event for the view to animate against and is not waited on here.

import type { Grant, Tile } from '../data/schema.ts';
import { createRun } from '../run/fsm.ts';
import type { RunController, RunPartyUnit, RunState } from '../run/types.ts';
import type { CombatTurnRecord, OverloadRow } from '../screens/combat/index.ts';
import { loadChatterPool } from '../screens/stage/chatter.ts';
import { createStageScreen } from '../screens/stage/index.ts';
import { branchLabelFor, branchSentenceFor } from '../screens/stage/labels.ts';
import type { WalkUnitView } from '../screens/stage/walk.ts';

import { createFightView } from './fight-view.ts';
import type { FightOutcome, FightView } from './fight-view.ts';
import type { GameContext } from './game-context.ts';
import { playPhaseEntrance } from './juice.ts';
import { hold, TEST_PACE } from './pace.ts';
import type { PaceProfile } from './pace.ts';
import { screenIdForTile } from './routes.ts';
import type { ScreenId } from './routes.ts';
import type { ScreenView } from './screen-view.ts';
import { NO_SETTLE } from './settle.ts';
import type { SettleTracker } from './settle.ts';
import { mountScreen } from './shell.ts';
import { createTaskQueue } from './task-queue.ts';
import { afterArrival, afterOutcome } from './transition.ts';
import {
  createCouncilView,
  createEndView,
  createRestView,
  createTrainingView,
} from './tile-views.ts';
import type { CouncilPayout } from './tile-views.ts';

/** The walk budget an automated gate runs on — 0 ms, declared in `data/tuning.json`. */
const GATE_WALK_DURATION_REF = 'walk.testDurationMs';

/** A unit at the floor is down (PRD §2.5) — a domain fact, not a tunable. */
const DOWNED = 0;

/** A branch that costs the party nothing. The ABSENCE of a hit, not a tuned amount. */
const NO_GAUGE_HIT = 0;

export interface DirectorOptions {
  readonly context: GameContext;
  /** The shell's boot slot (u1). Screens are the only things that ever go in it. */
  readonly slot: HTMLElement;
  /** The authored chatter + 폭주 pools of `data/decisions.json`. */
  readonly chatter: readonly unknown[];
  readonly overload: readonly OverloadRow[];
  /** Automated gate: walks are budgeted at 0 ms. */
  readonly automatedGate?: boolean;
  /**
   * Plays each screen's engine half as soon as it is mounted — what makes the SHIPPED
   * page play itself for a human who has no test seam to call. Off under an automated
   * gate, where the spec drives the beats itself and determinism is the point.
   */
  readonly autoplay?: boolean;
  readonly seed?: number;
  /** How long the run lets a human look at things. Defaults to every hold zeroed. */
  readonly pace?: PaceProfile;
  /** Flips `[data-settled]` on the shell around every phase change. */
  readonly settle?: SettleTracker;
}

/**
 * One resolved combat turn of the RUN — the record `player.ts` already keeps, tagged
 * with the tile whose fight produced it (u17).
 */
export interface RunTurn extends CombatTurnRecord {
  readonly tileId: string;
}

export interface Director {
  /** The screen id currently in the slot, or null before the first mount. */
  mounted(): string | null;
  state(): RunState;
  /** unitId → equipped card ids. The run's cards, live. */
  loadout(): Record<string, string[]>;
  /** Every combat turn the run has resolved, in order, tagged with its tile. */
  turns(): RunTurn[];
  /** Begins the run. */
  start(): void;
  /**
   * Plays every engine-driven beat pending — the queued run steps, then the engine half
   * of the screen that was ALREADY in the slot — and resolves when the app is waiting on
   * a player click. It never presses a player verb.
   *
   * A screen that arrives during the drain is left un-played on purpose: the party has
   * just walked into a new tile, and the caller gets to see the tile it walked into
   * before its first turn resolves.
   */
  drain(): Promise<void>;
}

interface Mounted {
  readonly id: ScreenId;
  readonly view: ScreenView;
  readonly unmount: () => void;
}

export function createDirector(options: DirectorOptions): Director {
  const { context, slot, chatter, overload } = options;
  const { map, tuning } = context.data;
  const queue = createTaskQueue();
  const pace = options.pace ?? TEST_PACE;
  const settle = options.settle ?? NO_SETTLE;

  /** Every fight the run has opened, oldest first — the source of `turns()`. */
  const fights: FightView[] = [];

  const startParty: RunPartyUnit[] = context.partyIds.map((unitId) => ({
    unitId,
    hp: context.heroById(unitId).hp,
  }));

  const controller: RunController = createRun({
    map,
    tuning,
    party: startParty,
    walkDurationRef: options.automatedGate === true ? GATE_WALK_DURATION_REF : undefined,
    seed: options.seed,
  });

  let current: Mounted | null = null;

  /**
   * The engine half of the screen that is in the slot, played without a player verb.
   *
   * `drain()` is the same walk for a gate; this is the one for a HUMAN. Without it
   * `advance()` is reachable only through `window.__app`, which the shipped page never
   * publishes — so at `/` the first fight would sit on 턴 1 forever and every read
   * must-prove 2 asks for (action choice · bubble · pose) would be unobservable.
   *
   * It never presses a player verb: a screen with no engine half (훈련장 · 휴식 · 종료)
   * and the fork are still waiting on a click, exactly as before.
   */
  const autoAdvance = (mounted: Mounted): void => {
    if (options.autoplay !== true) return;
    const advance = mounted.view.advance;
    if (advance === undefined) return;
    queue.push(() => {
      // A screen the run walked onto meanwhile owns the slot now; it will be driven by
      // its own mount. Only the screen this was queued for may be played here.
      if (current !== mounted) return;
      // A beat that cannot play must never stop the run (INV-7): the same
      // resolve-either-way idiom `pace.ts` uses for a hold that drops a frame.
      void advance().then(
        () => undefined,
        () => undefined,
      );
    });
  };

  const show = (id: ScreenId, view: ScreenView): void => {
    current?.unmount();
    slot.replaceChildren();
    const unmount = mountScreen(id, slot, { view });
    const mounted: Mounted = {
      id,
      view,
      unmount: typeof unmount === 'function' ? unmount : (): void => {},
    };
    current = mounted;
    // The phase change, as the player experiences it: the entrance is re-armed and the
    // shell reports itself un-settled until the slot stops moving (u17).
    playPhaseEntrance(view.element);
    settle.begin();
    autoAdvance(mounted);
  };

  // ── the run's own screens ──────────────────────────────────────────────────

  const restart = (): void => {
    controller.restart();
    context.reset();
    // 재시작 replays the RUN: the fights of the previous attempt are no longer part of it.
    fights.length = 0;
    controller.start();
  };

  const party: WalkUnitView[] = context.partyIds.map((unitId) => ({
    unitId,
    name: context.heroById(unitId).name,
    gauge: context.gauge().valueOf(unitId),
  }));

  // ONE stage screen for the director's lifetime: it subscribes to the controller and
  // renders whatever phase the run is in, so re-creating it per walk would stack a new
  // listener on every tile.
  const stage: ScreenView = {
    element: createStageScreen({
      controller,
      party,
      chatter: loadChatterPool(chatter),
      tuning,
      branchLabel: branchLabelFor(map.tiles),
      branchSentence: branchSentenceFor(map.tiles),
      onBranchPick: (tileId) => {
        controller.chooseBranch(tileId);
      },
      onRestart: restart,
    }),
  };

  const tileOf = (tileId: string): Tile => {
    const tile = map.tiles.find((candidate) => candidate.id === tileId);
    if (tile === undefined) throw new Error(`map declares no tile '${tileId}'`);
    return tile;
  };

  const grantOf = (tile: Tile): Grant | null =>
    tile.rewardId === undefined ? null : (context.data.council.rewards[tile.rewardId] ?? null);

  const resolve = (result?: { party: readonly RunPartyUnit[] }): void => {
    controller.resolveTile(result);
  };

  /** The reward step of a tile: hand the card out, then let the run move on. */
  const openReward = (grant: Grant): void => {
    show(
      'training',
      createTrainingView({ context, grant, onDone: () => resolve() }),
    );
  };

  const afterFight = (tile: Tile, outcome: FightOutcome): void => {
    if (outcome === 'defeat') {
      resolve({ party: context.partyIds.map((unitId) => ({ unitId, hp: DOWNED })) });
      return;
    }
    const grant = grantOf(tile);
    if (grant === null) {
      resolve();
      return;
    }
    openReward(grant);
  };

  const openTile = (tile: Tile): void => {
    const screenId = screenIdForTile(tile.kind);

    if (screenId === 'combat') {
      const fight = createFightView({
        context,
        tile,
        overload,
        beatHoldMs: pace.beatHoldMs,
        // The settled fight stays readable before its reward replaces it.
        onOutcome: (outcome) => {
          afterOutcome(fight.element, () => {
            afterFight(tile, outcome);
          });
        },
      });
      fights.push(fight);
      show('combat', fight);
      return;
    }

    if (screenId === 'council') {
      // 퍼즐 오답 costs the WHOLE party (PRD §2.5); the hit lands when the tile is left,
      // so the readouts the player just watched do not move under the verdict.
      let pending = NO_GAUGE_HIT;
      show(
        'council',
        createCouncilView({
          context,
          tile,
          grant: grantOf(tile) ?? { kind: 'none' },
          onSettled: (settled: CouncilPayout) => {
            pending = settled.gaugeAll;
          },
          onDone: () => {
            if (pending > NO_GAUGE_HIT) context.gauge().addAll(pending);
            resolve();
          },
        }),
      );
      return;
    }

    if (screenId === 'training') {
      const grant = grantOf(tile);
      if (grant === null) {
        resolve();
        return;
      }
      openReward(grant);
      return;
    }

    if (screenId === 'rest') {
      show('rest', createRestView({ context, onDone: () => resolve() }));
      return;
    }

    throw new Error(`tile '${tile.id}' routes to '${screenId}', which plays no tile`);
  };

  controller.on((event) => {
    switch (event.type) {
      case 'walk-start':
        show('stage', stage);
        queue.push(() => {
          controller.walkComplete();
        });
        return;
      case 'tile-event': {
        // The party is SEEN arriving: the walk plays out its last beat before the tile
        // it ended on takes the slot (see `transition.ts`).
        const tile = tileOf(event.tile.id);
        afterArrival(slot, () => {
          // …and at the authored pace the walk itself is READ before the tile opens:
          // `walk.durationMs` is the budget the walk was declared with, and this is the
          // only place the composition spends it (u17 §1-3). At gate pace it is 0 ms.
          void hold(slot, pace.arrivalHoldMs).then(() => {
            openTile(tile);
          });
        });
        return;
      }
      case 'branch-request':
        show('stage', stage);
        return;
      case 'clear':
      case 'defeat':
        show('end', createEndView({ result: event.type, onRestart: restart }));
        return;
      default:
        return;
    }
  });

  return {
    mounted: () => current?.id ?? null,
    state: () => controller.getState(),
    loadout: () => context.loadoutMap(),
    turns: () =>
      fights.flatMap((fight) =>
        fight.fixture.turns.map((turn) => ({ tileId: fight.fixture.tileId, ...turn })),
      ),
    start: () => {
      controller.start();
    },
    drain: async () => {
      // The screen is captured BEFORE anything is awaited: a drain plays the beats of
      // the screen it was called on, and a screen the run walks onto meanwhile is left
      // standing for the caller to see.
      const playing = current;
      await queue.settled();
      if (playing === null || playing !== current) return;
      const advance = playing.view.advance;
      if (advance === undefined) return;
      await advance();
    },
  };
}
