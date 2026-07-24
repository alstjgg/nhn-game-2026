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
import { createMachine, reduce, type MachineState, type Phase } from '../../state/index.ts';
import '../../styles/conversation.css';

/** Host hooks for events the conversation screen itself has no authority over. */
export interface ConversationCallbacks {
  /**
   * Fired the moment the machine's phase leaves `'conversation'` — today that
   * is only the forced-crafting handoff (u2 F3: patience reaches zero). The
   * screen has no crafting UI of its own, so once this fires the dialogue is
   * frozen (choices already disabled) and the host owns what happens next.
   */
  onPhaseChange?: (phase: Phase) => void;
  /**
   * Fired when the dialogue reaches its natural end — the last node's choice has
   * been committed with patience to spare (the non-forced path). The screen has
   * no crafting UI of its own, so it surfaces a proceed affordance and hands the
   * decision to advance to crafting back to the host (u8 app shell).
   */
  onComplete?: () => void;
}

/**
 * Mount the conversation screen for one customer into `container`.
 * Portrait, patience meter, observe affordance and clue shelf are built once
 * and persist; only the NPC line and dialogue choices re-render per node.
 */
export function mountConversation(
  container: HTMLElement,
  customer: Customer,
  callbacks: ConversationCallbacks = {},
): void {
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

  // Proceed affordance — hidden until the dialogue reaches its natural end. It
  // is a plain <button> (never a native form control / free-text field: the
  // membrane §4.1 / cards-never-forms §4.5 still hold), and hands the
  // conversation→crafting decision back to the host via onComplete.
  const proceedBtn = document.createElement('button');
  proceedBtn.type = 'button';
  proceedBtn.className = 'proceed-btn anim-portrait-enter';
  proceedBtn.dataset.testid = 'conversation-proceed';
  proceedBtn.textContent = '[처방을 지으러 간다]';
  proceedBtn.hidden = true;
  proceedBtn.addEventListener('click', () => callbacks.onComplete?.());

  screen.append(portrait, meter, lineHost, choicesHost, observeBtn, clueShelf, proceedBtn);
  container.replaceChildren(screen);

  updateMeter();
  renderNode();

  /** Sync the meter fill's scaleX to the fraction of patience remaining. */
  function updateMeter(): void {
    const ratio =
      customer.patienceBudget > 0 ? state.patience / customer.patienceBudget : 0;
    fill.style.transform = `scaleX(${ratio})`;
    // Feed the fill's colour interpolation (u9 juice): the bar shifts from accent
    // toward --color-alarm as patience drains, so growing impatience is felt, not
    // just measured. Pure presentation — the number is still the reducer's (D4).
    fill.style.setProperty('--patience', String(ratio));
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
        // A dialogue choice is a one-shot commit action, not a toggle: `.card`'s
        // native primitive toggles selected on/off per click, but re-clicking an
        // already-committed choice must never re-commit. On a non-terminal node
        // `renderNode()` replaces these cards outright when advancing, so this
        // only bites on the conversation's last node — guard it directly instead
        // of leaning on that replacement as an accidental safety net.
        const card = createCard({
          label: choice.label,
          onToggle: (selected) => {
            if (!selected) return;
            commitChoice(choice);
          },
        });
        card.dataset.testid = 'choice-card';
        return card;
      });
    choicesHost.replaceChildren(...cards);
  }

  /** Disable every current choice card so a commit can never fire twice. */
  function disableChoices(): void {
    for (const card of choicesHost.querySelectorAll('button')) {
      card.disabled = true;
    }
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
    // Freeze the just-committed node's cards immediately: on a non-terminal
    // node `renderNode()` below replaces them anyway, but on the terminal node
    // nothing else would stop a second click on the same (or another) card
    // from committing again.
    disableChoices();

    if (state.phase !== 'conversation') {
      // u2's reducer forces crafting the instant patience hits zero (F3). This
      // screen owns dialogue only — it has no crafting UI — so it stops
      // advancing and hands the phase change to the host rather than going
      // dead-ended with a frozen, zeroed-out meter.
      callbacks.onPhaseChange?.(state.phase);
      return;
    }

    if (cursor + 1 < customer.dialogueNodes.length) {
      cursor += 1;
      renderNode();
    } else {
      // Terminal node committed with patience to spare — the dialogue is done.
      // Reveal the proceed affordance so the host can advance to crafting.
      proceedBtn.hidden = false;
    }
  }
}
