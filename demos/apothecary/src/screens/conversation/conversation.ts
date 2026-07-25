// conversation.ts — the customer conversation screen (u6, PRD §1.2/§1.3 + §2).
//
// Renders one customer's dialogue slice, data-driven from a loaded Customer
// (u3 schema / u4 content): the portrait enters via the u5 `portrait-enter`
// animation, the NPC line reveals through the `type-on` animation, and dialogue
// choices are u5 `.card` primitives — never native form controls (membrane §4.1
// / cards-never-forms §4.5).
//
// u10 — the hand is now a MULTIVERB beat (PRD §1 must-prove 2): every beat
// offers 3–4 cards and each card names the act it performs in `verb`, which is
// the ONLY thing dispatch reads. (Before u10 the free [관찰] card was told apart
// by `patienceCost === 0`; `craft` is a second free verb, so that heuristic no
// longer identifies anything.) Beats arrive from an injected beat source, so
// live-generated and seeded beats reach this renderer as the same type.
//
// Four affordances, deliberately distinct (design D6/D7):
//   • `indirect` / `direct` question cards — pressing one spends patience and
//     advances the conversation to the next beat; the patience meter animates
//     down via a CSS transform transition (design D4), never an instant flip.
//   • the `observe` card and the persistent [관찰] button (both free) — reveal
//     the current beat's observation clues as distinct `.card--clue` cards in
//     their own shelf, idempotently (re-observing never duplicates a clue) and
//     without advancing the beat.
//   • the `craft` card ([조제하러 가기]) — an immediate early exit that hands
//     the conversation→crafting decision straight back to the host.
//
// Patience arithmetic is delegated to the u2 pure reducer so the balance rule
// (a data typo can never heal patience) is enforced in one place.
import { createCard } from '../../ui/card.ts';
import type { AIAdapter } from '../../ai/adapter.ts';
import type { BeatChoice, ChoiceVerb, DialogueBeat } from '../../ai/contract.ts';
import type { Customer } from '../../data/schema.ts';
import { createMachine, reduce, type MachineState, type Phase } from '../../state/index.ts';
import { tierFor } from '../../state/patience-tier.ts';
import { createBeatSource, toBeat, type BeatSource } from './beats.ts';
import '../../styles/conversation.css';

/**
 * Card order is load-bearing: the app-level e2e flows drive a conversation via
 * the FIRST choice card and expect it to be the paid question path, so the hand
 * is always laid out question → question → observation → craft regardless of
 * the order a generated beat happened to list its cards in.
 */
const VERB_ORDER: Record<ChoiceVerb, number> = {
  indirect: 0,
  direct: 1,
  observe: 2,
  craft: 3,
};

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
 * Where the beats come from. Additive and optional: a 2/3-argument call site
 * keeps the seeded `data/customers.json` slice it always had (the app shell's
 * wiring is its own unit's business).
 */
export interface ConversationOptions {
  /** Pre-built source (tests / harnesses); wins over `adapter` when present. */
  beatSource?: BeatSource;
  /** AI adapter driving the beats; absent ⇒ seeded beats only. */
  adapter?: AIAdapter;
}

/**
 * Mount the conversation screen for one customer into `container`.
 * Portrait, patience meter, observe affordance and clue shelf are built once
 * and persist; only the NPC line and the hand re-render per beat.
 */
export function mountConversation(
  container: HTMLElement,
  customer: Customer,
  callbacks: ConversationCallbacks = {},
  options: ConversationOptions = {},
): void {
  const clueTextById = new Map(customer.observationClues.map((c) => [c.id, c.text]));
  const revealedClueIds = new Set<string>();
  // Enter the conversation phase up front: the u2 reducer only spends patience
  // while `phase === 'conversation'`, and a fresh machine starts at `entrance`.
  let state: MachineState = reduce(createMachine(customer.patienceBudget), {
    type: 'advance',
  });
  // Beats arrive asynchronously (the adapter may be a network call), so the
  // cursor counts beats already PAINTED — it is what decides whether the
  // committed beat was the conversation's last one.
  let cursor = -1;
  let current: DialogueBeat | undefined;
  /** Monotonic render token: a late beat from a superseded pull is dropped. */
  let renderToken = 0;
  /** Set once the dialogue is over (craft card, or forced crafting). */
  let finished = false;

  const source: BeatSource =
    options.beatSource ??
    createBeatSource({
      seeded: customer.dialogueNodes.map(toBeat),
      customer,
      adapter: options.adapter,
      patienceTier: () => tierFor(state.patience, customer.patienceBudget),
      revealed: () => revealedClueIds,
    });

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
  void renderBeat();

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

  /**
   * Pull the next beat and paint it. The beat source never rejects, so there is
   * no error branch; a beat that arrives after a newer pull started is dropped
   * (its token is stale) so the hand can never rewind.
   */
  async function renderBeat(): Promise<void> {
    renderToken += 1;
    const token = renderToken;
    const beat = await source.next();
    if (token !== renderToken) return;
    cursor += 1;
    current = beat;
    paintBeat(beat);
  }

  /** Re-render the NPC line (retriggering type-on) and the beat's hand. */
  function paintBeat(beat: DialogueBeat): void {
    const line = document.createElement('p');
    line.className = 'npc-line anim-type-on';
    line.dataset.testid = 'npc-line';
    line.textContent = beat.npcLine;
    lineHost.replaceChildren(line);

    const cards = [...beat.choices]
      .sort((a, b) => VERB_ORDER[a.verb] - VERB_ORDER[b.verb])
      .map((choice) => {
        // A card is a one-shot action, not a toggle: `.card`'s native primitive
        // toggles selected on/off per click, but re-clicking an already-committed
        // card must never act twice. On a non-terminal beat `renderBeat()`
        // replaces these cards outright when advancing, so this only bites on the
        // conversation's last beat — guard it directly instead of leaning on that
        // replacement as an accidental safety net.
        const card = createCard({
          label: choice.label,
          onToggle: (selected) => {
            if (!selected) return;
            playCard(choice);
          },
        });
        card.dataset.testid = 'choice-card';
        card.dataset.verb = choice.verb;
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

  /** [관찰]: reveal the current beat's observation clues, free of charge. */
  function observe(): void {
    for (const choice of current?.choices ?? []) {
      if (choice.verb === 'observe') reveal(choice.clueReveals);
    }
  }

  /**
   * Dispatch a pressed card on its `verb` — the only thing that decides what a
   * card DOES (never its cost, which is the reducer's arithmetic input alone).
   */
  function playCard(choice: BeatChoice): void {
    if (finished) return;
    switch (choice.verb) {
      case 'observe':
        // Free and non-advancing: the rest of the hand stays live.
        reveal(choice.clueReveals);
        return;
      case 'craft':
        // Early exit: the screen owns no crafting UI, so the host decides.
        finished = true;
        disableChoices();
        callbacks.onComplete?.();
        return;
      case 'indirect':
      case 'direct':
        commitChoice(choice);
        return;
      default: {
        // Exhaustiveness guard: a new verb fails to compile here rather than
        // silently rendering a card that does nothing when pressed.
        const exhaustive: never = choice.verb;
        return exhaustive;
      }
    }
  }

  /** Commit a question card: spend patience, reveal its clues, advance a beat. */
  function commitChoice(choice: BeatChoice): void {
    state = reduce(state, { type: 'chooseDialogue', cost: choice.patienceCost });
    updateMeter();
    reveal(choice.clueReveals);
    // The pressed card is what the NEXT request reports as the player's move,
    // so the customer can react to what was actually asked.
    source.recordChoice(choice.label);
    // Freeze the just-committed beat's cards immediately: on a non-terminal beat
    // the cards are cleared below anyway, but on the terminal beat nothing else
    // would stop a second click on the same (or another) card from acting again.
    disableChoices();

    if (state.phase !== 'conversation') {
      // u2's reducer forces crafting the instant patience hits zero (F3). This
      // screen owns dialogue only — it has no crafting UI — so it stops
      // advancing and hands the phase change to the host rather than going
      // dead-ended with a frozen, zeroed-out meter.
      finished = true;
      callbacks.onPhaseChange?.(state.phase);
      return;
    }

    if (cursor + 1 < source.total) {
      // Clear the spent hand while the next beat is in flight: a stale, frozen
      // card set must never be mistaken for the beat being played.
      choicesHost.replaceChildren();
      void renderBeat();
    } else {
      // Terminal beat committed with patience to spare — the dialogue is done.
      // Reveal the proceed affordance so the host can advance to crafting.
      finished = true;
      proceedBtn.hidden = false;
    }
  }
}
