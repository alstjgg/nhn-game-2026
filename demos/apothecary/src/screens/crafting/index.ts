// index.ts — mountCrafting(): the crafting screen's public seam (design §2.1).
// Dependency-injected and global-free so the e2e harness and the future app shell
// wire it identically. Holds the SelectionModel as the single source of truth,
// renders controlled cards, and runs the weighted [건네기] commit beat (§2.4):
// resolve → lock → animate the customer out → onCommit(result) → destroy.
import '../../styles/base.css';
import '../../styles/cards.css';
import './crafting.css';

import type { Ingredient, Outcome, OutcomeTable, CraftSelection } from '../../data/schema';
import { resolveOutcome } from '../../data/outcome';
import { CRAFTING_CONFIG } from './config';
import {
  buildCraftSelection,
  createSelection,
  isCommitReady,
  setDeclaration,
  setMethod,
  toggleIngredient,
  type SelectionModel,
} from './selection';
import { buildCraftingView, render, type CraftingView } from './view';

export interface CraftingDeps {
  /** Ingredient cards (validated via loadIngredients(data/ingredients.json)). */
  readonly ingredients: readonly Ingredient[];
  /** Active customer id (injected; design D-2). */
  readonly customerId: string;
  /** That customer's outcome table (injected; design D-1/D-2). */
  readonly outcomeTable: OutcomeTable;
  /** App persists the result + dispatches the payload-less machine 'commit' (D-2). */
  readonly onCommit: (result: CommitResult) => void;
}

export interface CommitResult {
  /** Sorted ingredientIds + verbatim method/declaration. */
  readonly selection: CraftSelection;
  /** resolveOutcome(...) — never undefined (total by construction). */
  readonly outcome: Outcome;
}

export interface CraftingHandle {
  readonly root: HTMLElement;
  /** Unmount + detach; idempotent. */
  destroy(): void;
}

/** Fallback so a missed animationend never strands the commit (design §2.4). */
const BEAT_FALLBACK_MS = 600;

export function mountCrafting(container: HTMLElement, deps: CraftingDeps): CraftingHandle {
  const view: CraftingView = buildCraftingView(deps.ingredients, CRAFTING_CONFIG);

  let model: SelectionModel = createSelection(CRAFTING_CONFIG.defaultDeclaration);
  let committed = false;
  let destroyed = false;

  const sync = (): void => {
    render(view, model, isCommitReady(model, CRAFTING_CONFIG.minIngredients));
  };

  const guarded = (mutate: () => void): void => {
    if (committed) return;
    mutate();
    sync();
  };

  for (const [id, card] of view.ingredientButtons) {
    card.addEventListener('click', () => {
      guarded(() => {
        model = toggleIngredient(model, id, CRAFTING_CONFIG.maxIngredients);
      });
    });
  }
  for (const [verb, card] of view.methodButtons) {
    card.addEventListener('click', () => {
      guarded(() => {
        model = setMethod(model, verb);
      });
    });
  }
  for (const [verb, card] of view.declarationButtons) {
    card.addEventListener('click', () => {
      guarded(() => {
        model = setDeclaration(model, verb);
      });
    });
  }

  view.commitButton.addEventListener('click', () => {
    if (committed || !isCommitReady(model, CRAFTING_CONFIG.minIngredients)) return;
    commit();
  });

  function commit(): void {
    committed = true;
    const selection = buildCraftSelection(model);
    const outcome = resolveOutcome(deps.outcomeTable, selection);

    // Lock synchronously (belt) — CSS lock (suspenders) rides on the class (AC10).
    view.root.classList.add('crafting--committed');
    view.commitButton.disabled = true;

    // Fire the weighted beat: entering → committing, customer portrait exits (§1.3).
    // crafting.css keys the portrait's commit-beat animation off crafting--committing,
    // so animationstart (AC8) and the resolving animationend (below) are guaranteed.
    view.root.classList.remove('crafting--entering');
    view.root.classList.add('crafting--committing');

    let resolved = false;
    const finish = (): void => {
      if (resolved) return;
      resolved = true;
      view.beatElement.removeEventListener('animationend', finish);
      window.clearTimeout(fallback);
      deps.onCommit({ selection, outcome });
      destroy();
    };
    view.beatElement.addEventListener('animationend', finish);
    const fallback = window.setTimeout(finish, BEAT_FALLBACK_MS);
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    view.root.remove();
  }

  container.appendChild(view.root);
  sync();

  return { root: view.root, destroy };
}
