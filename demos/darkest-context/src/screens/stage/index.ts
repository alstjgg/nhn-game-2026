// u14 — the run's render surface: walk → fork → clear/defeat (PRD §2.4, §2.5).
//
// Everything here is driven by the FSM's event stream and nothing else. There is
// no clock in this file and none in the view it owns (INV-6): a walk ends when
// `walk-complete` arrives, so the screen only ever answers the question "what does
// the run look like NOW". The single player input point of a run — the branch card
// pair — is reported back through `chooseBranch`, and 재시작 through `restart`.
//
// Chatter is chosen the moment a walk starts, by tile index alone, so replaying a
// route replays the same conversation (PRD §2.4, INV-6).

import { createEndScreen, type EndResult } from '../end/index.ts';
import { pickChatter, type ChatterExchange, type ChatterPlay } from './chatter.ts';
import { createWalkView, type WalkUnitView } from './walk.ts';
import type { Tuning } from '../../data/schema.ts';
import type { RunController, RunPhase } from '../../run/types.ts';
import '../../styles/stage.css';

export interface StageScreenOptions {
  /** The run being rendered. The screen subscribes; it never advances a walk itself. */
  readonly controller: RunController;
  readonly party: readonly WalkUnitView[];
  /** The authored exchange pool (data/decisions.json → `chatter`). */
  readonly chatter: readonly ChatterExchange[];
  readonly tuning: Tuning;
  /** Display name for a fork's destination tile. Defaults to the tile id. */
  readonly branchLabel?: (tileId: string) => string;
  /** How a fork click is committed. Defaults to the controller's own API. */
  readonly onBranchPick?: (tileId: string) => void;
  /** How 재시작 is honoured. Defaults to restart-then-start on the controller. */
  readonly onRestart?: () => void;
  /** Reports what each walk played — the observation seam for chatter determinism. */
  readonly onChatter?: (play: ChatterPlay) => void;
}

function isTerminal(phase: RunPhase): phase is EndResult {
  return phase === 'clear' || phase === 'defeat';
}

export function createStageScreen(options: StageScreenOptions): HTMLElement {
  const { controller, party, chatter, tuning, branchLabel, onChatter } = options;

  const thresholds = {
    uneasy: tuning.gauge.tiers.uneasy,
    limit: tuning.gauge.tiers.limit,
    overload: tuning.gauge.tiers.overload,
  };

  const pick = (tileId: string): void => {
    if (options.onBranchPick !== undefined) {
      options.onBranchPick(tileId);
      return;
    }
    controller.chooseBranch(tileId);
  };

  const restart = (): void => {
    if (options.onRestart !== undefined) {
      options.onRestart();
      return;
    }
    controller.restart();
    controller.start();
  };

  const view = createWalkView({ party, thresholds, branchLabel });

  const root = document.createElement('div');
  root.className = 'dc-run';
  root.append(view.element);

  /** How far into the run the party is; -1 before the first walk of a run. */
  let tileIndex = -1;
  let shownEnd: EndResult | null = null;

  const sync = (): void => {
    const state = controller.getState();

    if (isTerminal(state.phase)) {
      if (shownEnd !== state.phase) {
        shownEnd = state.phase;
        root.replaceChildren(createEndScreen({ result: state.phase, onRestart: restart }));
      }
      return;
    }

    if (shownEnd !== null) {
      shownEnd = null;
      root.replaceChildren(view.element);
    }
    view.setPhase(state.phase);
    // Bubbles belong to the walk that opened them — arrival closes them.
    if (state.phase !== 'walking') view.setChatter([]);
    view.setFork(state.branchOptions, pick);
  };

  controller.on((event) => {
    if (event.type === 'run-start') {
      tileIndex = -1;
      view.setChatter([]);
    }
    if (event.type === 'walk-start') {
      tileIndex += 1;
      const play = pickChatter(chatter, tuning.chatter, tileIndex);
      view.setChatter(play.exchanges);
      onChatter?.(play);
    }
    sync();
  });

  sync();
  return root;
}

export { loadChatterPool, pickChatter } from './chatter.ts';
export type { ChatterExchange, ChatterLine, ChatterPlay } from './chatter.ts';
export { createWalkView } from './walk.ts';
export type { WalkUnitView, WalkView, WalkViewOptions } from './walk.ts';
