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
// u11 — patience is DIEGETIC (PRD §2.2, invariant §3-4): there is no gauge and
// no number. The only patience readout is the customer: the u2-derived
// expression tier is mirrored onto the screen root as `data-tier`, which moves
// the u9 portrait's expression column and (from 짜증 on) starts an ambient
// finger tap. Every visual consequence selects off that one attribute in CSS, so
// the motion policy — and the reduced-motion guard over it — stays in the
// stylesheet (design D1).
//
// Four affordances, deliberately distinct (design D6/D7):
//   • `indirect` / `direct` question cards — pressing one spends patience and
//     advances the conversation to the next beat; the spend is felt as the
//     customer's expression tightening, never as a bar ticking down.
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
import { mountPortrait, type PortraitHandle } from '../../ui/portrait.ts';
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
 * What the host keeps hold of after mounting (u13, PRD §2.3). The screen owns no
 * generation of its own: the portrait sheet is pushed in by whoever prefetched
 * it, whenever it lands — at mount, or mid-conversation.
 */
export interface ConversationHandle {
  /**
   * Resolve the backlit silhouette into an already-pixelated sheet, IN PLACE:
   * u9's panel is CSS-sized, so this is a repaint of the cell the customer was
   * already occupying and never a layout change (§2.3 "arrival mid-conversation
   * is expected and must not reflow the layout"). Calling it before any sheet
   * exists is simply never done; calling it twice just repaints.
   */
  setPortraitSheet(url: string): void;
}

/**
 * The screen's ONLY touchpoint with the u9 portrait component (design D3): it
 * wraps the framed panel in the host element this screen has always exposed —
 * `[data-testid=portrait]`, `role=img`, the customer's name as the label and the
 * u5 enter animation — so the v1 a11y/animation contract survives the swap while
 * u9 keeps its own `portrait-frame` / `portrait-cell` hooks untouched.
 */
function buildPortrait(customer: Customer): { host: HTMLElement; handle: PortraitHandle } {
  const host = document.createElement('div');
  host.className = 'conversation__portrait anim-portrait-enter';
  host.dataset.testid = 'portrait';
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', customer.name);
  return { host, handle: mountPortrait(host) };
}

/**
 * Mount the conversation screen for one customer into `container`.
 * Portrait, observe affordance and clue shelf are built once and persist; only
 * the NPC line and the hand re-render per beat.
 */
export function mountConversation(
  container: HTMLElement,
  customer: Customer,
  callbacks: ConversationCallbacks = {},
  options: ConversationOptions = {},
): ConversationHandle {
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

  // Portrait — the u9 framed panel, whose expression column IS the patience
  // readout (u11). It animates in through the same u5 keyframe as before.
  const { host: portrait, handle: portraitPanel } = buildPortrait(customer);

  // Ambient impatience — a decorative, out-of-flow tap the stylesheet starts at
  // 짜증 and never before (design D1/D6). Purely presentational: it carries no
  // information the portrait does not, so screen readers skip it.
  const fingerTap = document.createElement('div');
  fingerTap.className = 'finger-tap';
  fingerTap.dataset.testid = 'finger-tap';
  fingerTap.setAttribute('aria-hidden', 'true');

  // The dialogue column — everything the customer says and the player answers
  // with, grouped so it can sit BESIDE the portrait panel instead of under it.
  // The u9 panel is tall (a 3:4 sheet cell): stacked, the screen outgrew the
  // viewport, and a page that scrolls on a card press drags the customer's face
  // off the counter mid-conversation.
  const dialogue = document.createElement('div');
  dialogue.className = 'conversation__dialogue';

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

  dialogue.append(lineHost, choicesHost, observeBtn, clueShelf, proceedBtn);
  screen.append(portrait, dialogue, fingerTap);
  container.replaceChildren(screen);

  syncTier();
  syncPhase();
  void renderBeat();

  // The host's only handle on this screen. Everything below is a hoisted
  // function declaration, so the mount is complete at this point.
  return {
    setPortraitSheet(url: string): void {
      portraitPanel.setSheet(url);
    },
  };

  /**
   * Publish the patience tier: one attribute write, plus the portrait's column.
   * The thresholds are u2's alone (`tierFor` over data/patience-tiers.json) and
   * every visual consequence — the expression, the ambient tap, the warmth —
   * hangs off `[data-tier]` in CSS, so this screen holds no tier maths and no
   * animation timing of its own (design D1/D4).
   */
  function syncTier(): void {
    const tier = tierFor(state.patience, customer.patienceBudget);
    const next = String(tier);
    if (screen.dataset.tier === next) return;
    screen.dataset.tier = next;
    portraitPanel.setTier(tier);
  }

  /**
   * Mirror the machine's phase onto the root so the forced-crafting handoff is
   * observable without a meter — the host's `onPhaseChange` is a callback, and a
   * harness (or a judge) has nothing to look at otherwise (design D5).
   */
  function syncPhase(): void {
    screen.dataset.phase = state.phase;
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
    syncTier();
    syncPhase();
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
      // dead-ended on a customer whose patience is already spent.
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
