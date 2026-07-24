// conversation.ts — the customer conversation screen (u6, PRD §1.2/§1.3 + §2).
//
// Renders one customer's dialogue slice, data-driven from a loaded Customer
// (u3 schema / u4 content): the portrait enters via the u5 `portrait-enter`
// animation, the NPC line reveals through the `type-on` animation, and dialogue
// choices are u5 `.card` primitives — never native form controls (membrane §4.1
// / cards-never-forms §4.5).
//
// Two affordances, deliberately distinct (design D6/D7):
//   • dialogue choices (patienceCost > 0) — pressing one spends patience and
//     advances the conversation to the next node; the patience meter animates
//     down via a CSS transform transition (design D4), never an instant flip.
//   • the persistent [관찰] observe button (0 patience) — reveals the current
//     node's observation clues as distinct `.card--clue` cards in their own
//     shelf, idempotently (re-observing never duplicates a clue).
//
// Patience arithmetic is delegated to the u2 pure reducer so the balance rule
// (a data typo can never heal patience) is enforced in one place.
import { createCard } from '../../ui/card.ts';
import type { Choice, Customer } from '../../data/schema.ts';
import { createMachine, reduce, type MachineState } from '../../state/index.ts';
import '../../styles/conversation.css';

/**
 * Mount the conversation screen for one customer into `container`.
 * Portrait, patience meter, observe affordance and clue shelf are built once
 * and persist; only the NPC line and dialogue choices re-render per node.
 */
export function mountConversation(container: HTMLElement, customer: Customer): void {
  const clueTextById = new Map(customer.observationClues.map((c) => [c.id, c.text]));
  const revealedClueIds = new Set<string>();
  // Enter the conversation phase up front: the u2 reducer only spends patience
  // while `phase === 'conversation'`, and a fresh machine starts at `entrance`.
  let state: MachineState = reduce(createMachine(customer.patienceBudget), {
    type: 'advance',
  });
  let cursor = 0;

  const screen = document.createElement('section');
  screen.className = 'conversation';

  // Portrait — CSS placeholder (design D9: no raster shipped), animates in.
  const portrait = document.createElement('div');
  portrait.className = 'portrait anim-portrait-enter';
  portrait.dataset.testid = 'portrait';
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', customer.name);
  const portraitName = document.createElement('span');
  portraitName.className = 'portrait__name';
  portraitName.textContent = customer.name;
  portrait.appendChild(portraitName);

  // Patience meter — a continuous scaleX fill driven off remaining patience,
  // animated by a CSS transition (design D4), not the full-drain keyframe.
  const meter = document.createElement('div');
  meter.className = 'patience-meter';
  meter.dataset.testid = 'patience-meter';
  const fill = document.createElement('div');
  fill.className = 'patience-fill';
  fill.dataset.testid = 'patience-fill';
  meter.appendChild(fill);

  // NPC line + choices live in the dialogue area and re-render per node.
  const lineHost = document.createElement('div');
  lineHost.className = 'npc-line-host';
  const choicesHost = document.createElement('div');
  choicesHost.className = 'choices card-shelf';

  // Persistent [관찰] affordance — separate from dialogue choices, 0 patience.
  const observeBtn = document.createElement('button');
  observeBtn.type = 'button';
  observeBtn.className = 'observe-btn';
  observeBtn.dataset.testid = 'observe-btn';
  observeBtn.textContent = '[관찰]';
  observeBtn.addEventListener('click', observe);

  // Clue shelf — distinct home for revealed observation clues.
  const clueShelf = document.createElement('div');
  clueShelf.className = 'clue-shelf card-shelf';
  clueShelf.dataset.testid = 'clue-shelf';

  screen.append(portrait, meter, lineHost, choicesHost, observeBtn, clueShelf);
  container.replaceChildren(screen);

  updateMeter();
  renderNode();

  /** Sync the meter fill's scaleX to the fraction of patience remaining. */
  function updateMeter(): void {
    const ratio =
      customer.patienceBudget > 0 ? state.patience / customer.patienceBudget : 0;
    fill.style.transform = `scaleX(${ratio})`;
  }

  /** Re-render the NPC line (retriggering type-on) and the node's choice cards. */
  function renderNode(): void {
    const node = customer.dialogueNodes[cursor];

    const line = document.createElement('p');
    line.className = 'npc-line anim-type-on';
    line.dataset.testid = 'npc-line';
    line.textContent = node.npcLine;
    lineHost.replaceChildren(line);

    const cards = node.choices
      .filter((choice) => choice.patienceCost > 0)
      .map((choice) => {
        const card = createCard({
          label: choice.label,
          onToggle: (selected) => {
            if (selected) commitChoice(choice);
          },
        });
        card.dataset.testid = 'choice-card';
        return card;
      });
    choicesHost.replaceChildren(...cards);
  }

  /** Add clue ids to the revealed set and repaint the shelf if anything is new. */
  function reveal(ids: readonly string[] | undefined): void {
    if (!ids || ids.length === 0) return;
    let changed = false;
    for (const id of ids) {
      if (!revealedClueIds.has(id)) {
        revealedClueIds.add(id);
        changed = true;
      }
    }
    if (changed) renderClues();
  }

  function renderClues(): void {
    const cards = [...revealedClueIds].map((id) => {
      const card = createCard({ label: clueTextById.get(id) ?? id });
      card.classList.add('card--clue');
      card.dataset.testid = 'clue-card';
      card.disabled = true; // clues are informational, not selectable
      return card;
    });
    clueShelf.replaceChildren(...cards);
  }

  /** [관찰]: reveal the current node's zero-cost observation clues, free of charge. */
  function observe(): void {
    const node = customer.dialogueNodes[cursor];
    for (const choice of node.choices) {
      if (choice.patienceCost === 0) reveal(choice.clueReveals);
    }
  }

  /** Commit a dialogue choice: spend patience, reveal its clues, advance a node. */
  function commitChoice(choice: Choice): void {
    state = reduce(state, { type: 'chooseDialogue', cost: choice.patienceCost });
    updateMeter();
    reveal(choice.clueReveals);
    if (cursor + 1 < customer.dialogueNodes.length) {
      cursor += 1;
      renderNode();
    }
  }
}
