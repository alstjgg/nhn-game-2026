// view.ts — pure DOM builders for the crafting screen. Controlled cards (design
// D-4): we reuse u5's `.card` / `.card--selected` visual vocabulary but render the
// buttons here so the three constrained groups (≤3 multi-select with a blocked 4th,
// single-select method, two-state declaration) stay driven by the selection model —
// `createCard` self-toggles and cannot express "blocked". No event wiring here;
// index.ts owns behaviour. render() is a pure model → class sync.
import type { Ingredient } from '../../data/schema';
import type { CraftingConfig } from './config';
import type { SelectionModel } from './selection';

export interface CraftingView {
  readonly root: HTMLElement;
  readonly commitButton: HTMLButtonElement;
  /** Ingredient cards keyed by ingredient id. */
  readonly ingredientButtons: ReadonlyMap<string, HTMLButtonElement>;
  /** Method cards keyed by verb. */
  readonly methodButtons: ReadonlyMap<string, HTMLButtonElement>;
  /** Declaration cards keyed by verb. */
  readonly declarationButtons: ReadonlyMap<string, HTMLButtonElement>;
  /** The animated element whose animationend resolves the commit beat. */
  readonly beatElement: HTMLElement;
}

const SELECTED = 'card--selected';

function makeCard(group: string, label: string, detail?: string): HTMLButtonElement {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.dataset.group = group;
  card.setAttribute('aria-pressed', 'false');

  const title = document.createElement('span');
  title.className = 'card__label';
  title.textContent = label;
  card.appendChild(title);

  if (detail !== undefined && detail !== '') {
    const sub = document.createElement('span');
    sub.className = 'card__detail';
    sub.textContent = detail;
    card.appendChild(sub);
  }
  return card;
}

function makeGroup(labelText: string, className: string): HTMLElement {
  const section = document.createElement('section');
  section.className = `crafting__group ${className}`;
  const heading = document.createElement('h2');
  heading.className = 'crafting__group-title';
  heading.textContent = labelText;
  section.appendChild(heading);
  return section;
}

/** Build the full crafting DOM tree (detached). index.ts mounts + wires it. */
export function buildCraftingView(
  ingredients: readonly Ingredient[],
  config: CraftingConfig,
): CraftingView {
  const root = document.createElement('div');
  root.className = 'crafting crafting--entering';

  // Customer portrait placeholder — the element the commit beat animates out (§1.3).
  const beatElement = document.createElement('div');
  beatElement.className = 'crafting__portrait';
  beatElement.dataset.role = 'portrait';
  root.appendChild(beatElement);

  // Ingredient grid (data-driven, F1/AC2).
  const ingredientSection = makeGroup('재료 (1–3장)', 'crafting__ingredients');
  const ingredientGrid = document.createElement('div');
  ingredientGrid.className = 'card-shelf crafting__grid';
  const ingredientButtons = new Map<string, HTMLButtonElement>();
  for (const ing of ingredients) {
    const detail = ing.propertyTags.join(' · ');
    const card = makeCard('ingredient', ing.name, detail);
    card.dataset.id = ing.id;
    ingredientButtons.set(ing.id, card);
    ingredientGrid.appendChild(card);
  }
  ingredientSection.appendChild(ingredientGrid);
  root.appendChild(ingredientSection);

  // Method group (single-select, F3/AC5).
  const methodSection = makeGroup('방식', 'crafting__methods');
  const methodShelf = document.createElement('div');
  methodShelf.className = 'card-shelf';
  const methodButtons = new Map<string, HTMLButtonElement>();
  for (const verb of config.methods) {
    const card = makeCard('method', verb);
    card.dataset.value = verb;
    methodButtons.set(verb, card);
    methodShelf.appendChild(card);
  }
  methodSection.appendChild(methodShelf);
  root.appendChild(methodSection);

  // Declaration toggle (two-state, F4/AC6).
  const declarationSection = makeGroup('건넬 말', 'crafting__declarations');
  const declarationShelf = document.createElement('div');
  declarationShelf.className = 'card-shelf';
  const declarationButtons = new Map<string, HTMLButtonElement>();
  for (const verb of config.declarations) {
    const card = makeCard('declaration', `[${verb}]`);
    card.dataset.value = verb;
    declarationButtons.set(verb, card);
    declarationShelf.appendChild(card);
  }
  declarationSection.appendChild(declarationShelf);
  root.appendChild(declarationSection);

  // Commit control — the weighted [건네기] (F7/AC7).
  const commitButton = document.createElement('button');
  commitButton.type = 'button';
  commitButton.className = 'crafting__commit';
  commitButton.dataset.action = 'commit';
  commitButton.textContent = '[건네기]';
  commitButton.disabled = true;
  root.appendChild(commitButton);

  return { root, commitButton, ingredientButtons, methodButtons, declarationButtons, beatElement };
}

function setSelected(card: HTMLButtonElement, selected: boolean): void {
  card.classList.toggle(SELECTED, selected);
  card.setAttribute('aria-pressed', String(selected));
}

/** Pure model → view sync: reflect the selection + commit-readiness into the DOM. */
export function render(view: CraftingView, model: SelectionModel, ready: boolean): void {
  for (const [id, card] of view.ingredientButtons) {
    setSelected(card, model.ingredientIds.includes(id));
  }
  for (const [verb, card] of view.methodButtons) {
    setSelected(card, model.method === verb);
  }
  for (const [verb, card] of view.declarationButtons) {
    setSelected(card, model.declaration === verb);
  }
  view.commitButton.disabled = !ready;
}
