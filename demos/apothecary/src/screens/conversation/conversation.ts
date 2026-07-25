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
// Three affordances, deliberately distinct (design D6/D7):
//   • `indirect` / `direct` question cards — pressing one spends patience and
//     advances the conversation to the next beat; the spend is felt as the
//     customer's expression tightening, never as a bar ticking down.
//   • the `observe` card (free) — reveals the current beat's observation clues
//     as distinct `.card--clue` cards in their own shelf, idempotently
//     (re-observing never duplicates a clue) and without advancing the beat.
//     (A standalone [관찰] button used to duplicate this route outside the
//     hand — u10 spec §Q3 flagged the redundancy; removed here, see the
//     integration note in `.claude/super/units/u10/spec.md`.)
//   • the `craft` card ([조제하러 가기]) — an immediate early exit that hands
//     the conversation→crafting decision straight back to the host.
//
// Patience arithmetic is delegated to the u2 pure reducer so the balance rule
// (a data typo can never heal patience) is enforced in one place.
import { createCard } from '../../ui/card.ts';
import { mountPortrait, type PortraitHandle } from '../../ui/portrait.ts';
import type { AIAdapter } from '../../ai/adapter.ts';
import type { BeatChoice, ChoiceVerb, DialogueBeat, PatienceTier } from '../../ai/contract.ts';
import type { Customer } from '../../data/schema.ts';
import {
  selectTierLine,
  shippedTierVariantIndex,
  type TierVariantIndex,
} from '../../data/tier-variants.ts';
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
   * dialogue is frozen from here on (choices already disabled), so this is the
   * host's cue to MIRROR the phase — not to swap the stage: the screen keeps the
   * customer's last line up behind the proceed affordance, and the player takes
   * the handover through `onComplete` (PR #33, R3). A host that also advanced on
   * this callback would delete the reply this press just earned.
   */
  onPhaseChange?: (phase: Phase) => void;
  /**
   * Fired when the player takes the handover to crafting — the ONLY event that
   * means "this conversation is done being looked at". It reaches the host from
   * all three endings: the craft card's early exit, the natural end (last node
   * committed with patience to spare) and, since PR #33 (R3), the forced end,
   * which surfaces the same proceed affordance instead of vanishing mid-line.
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
  /**
   * Authored tier variants the line on screen is re-toned through when the tier
   * moves; defaults to the shipped table (the same default the beat source uses).
   */
  tierVariants?: TierVariantIndex;
}

/**
 * What the host keeps hold of after mounting (u13, PRD §2.3). The screen owns no
 * generation of its own: the portrait sheet is pushed in by whoever prefetched
 * it, whenever it lands — at mount, or mid-conversation.
 */
export interface ConversationHandle {
  /**
   * The customer's CURRENT expression tier — the same value `data-tier` carries.
   * The host reads it at the conversation→crafting handoff so the crafting screen
   * can paint the face at the mood the conversation ended on (PR #33, R3): the
   * screen owns its own patience machine, so this is the only way out.
   */
  readonly tier: PatienceTier;
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
  // The palette/mirror variant is the customer's own (`Customer.portraitVariant`):
  // two customers may wear one bundled sheet, and this is what keeps them from
  // reading as the same person (PR #33, R1/R3).
  return {
    host,
    handle: mountPortrait(
      host,
      customer.portraitVariant === undefined ? {} : { variant: customer.portraitVariant },
    ),
  };
}

/**
 * Mount the conversation screen for one customer into `container`.
 * Portrait and clue shelf are built once and persist; only the NPC line and
 * the hand (which carries the `observe` card) re-render per beat.
 */
export function mountConversation(
  container: HTMLElement,
  customer: Customer,
  callbacks: ConversationCallbacks = {},
  options: ConversationOptions = {},
): ConversationHandle {
  const tierVariants: TierVariantIndex = options.tierVariants ?? shippedTierVariantIndex;
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
  //
  // It lives INSIDE the portrait host (PR #33, R3): pinned to the dialogue
  // column's far corner it was a 26x8 smudge ~600px from the face nobody reads as
  // a hand, while the player's eye is on the panel. At the panel's bottom edge it
  // is the customer's own hand on the counter — the position and the size are
  // conversation.css's, this only chooses the parent.
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

  // Clue shelf — distinct home for revealed observation clues.
  const clueShelf = document.createElement('div');
  clueShelf.className = 'clue-shelf card-shelf';
  clueShelf.dataset.testid = 'clue-shelf';

  // Proceed affordance — hidden until the dialogue is over, by EITHER ending: the
  // natural end (patience to spare) or the forced one (patience spent, PR #33 R3),
  // which needs it more, since the line it holds on screen is the customer's last
  // word. Whichever ending revealed it, pressing it is the handover to crafting. It
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

  dialogue.append(lineHost, choicesHost, clueShelf, proceedBtn);
  portrait.append(fingerTap);
  screen.append(portrait, dialogue);
  container.replaceChildren(screen);

  syncTier();
  syncPhase();
  void renderBeat();

  // The host's only handle on this screen. Everything below is a hoisted
  // function declaration, so the mount is complete at this point.
  return {
    get tier(): PatienceTier {
      return tierFor(state.patience, customer.patienceBudget);
    },
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
    reinkLine(tier);
  }

  /**
   * Re-tone the line ALREADY on screen to the new tier (PR #33, R3 on line 383).
   *
   * u12's toning used to be applied only when a NEW beat was painted, so the
   * conversation's last question got no verbal reply at all: the face hardened,
   * every card greyed out, and the customer repeated the previous sentence word
   * for word — the clearest "this is broken" signal a dialogue game can send. The
   * escalated lines (tier 2 "그만 물으시오.", tier 3 "약이나 지어 주시오.") were
   * dead content for every 2-node deck. Driving the toning off the tier change
   * makes the patience mechanic audible as well as visible.
   *
   * `selectTierLine` is TOTAL: a line the table does not know (a generated beat,
   * the stub's own toned script) is returned unchanged, so this can only ever
   * swap one authored variant for another of the same row. The text is written in
   * place — no new element — so the type-on animation does not re-fire and a
   * re-ink can never be mistaken for a new beat arriving.
   */
  function reinkLine(tier: PatienceTier): void {
    const line = lineHost.querySelector<HTMLElement>('[data-testid="npc-line"]');
    if (line === null) return;
    const current = line.textContent ?? '';
    const toned = selectTierLine(tierVariants, current, tier);
    if (toned !== current) line.textContent = toned;
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
      // advancing and reports the phase change to the host.
      //
      // It does NOT hand the stage over here (PR #33, R3 on line 383). The press
      // that spent the last of the patience is also the press whose reply
      // `syncTier` just re-inked at 한계 — and the forced handover used to unmount
      // that line in the same frame it was written, mid-type: the six authored
      // tier-3 lines ("약만 주시오." and its siblings) lived for ~40ms inside a
      // phase that was already fading out, so "his patience ran out" was the one
      // outcome in the game the customer never got to say out loud.
      //
      // So the forced ending lands on the SAME proceed affordance the
      // patience-to-spare ending uses: the last line stays legible for as long as
      // the player wants it, and the player takes the handover. No timer is
      // involved — a fixed hold would still be a gamble against a judge's reading
      // pace, and the shop never advances on a clock of its own (FR-9).
      finished = true;
      proceedBtn.hidden = false;
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
