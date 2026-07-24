// index.ts — the u8 app shell / sequencer (PRD §1.1 five-phase FSM + §1.4 overlap).
//
// Single page, NO routing: phases are DOM states swapped inside #app, and every
// swap ANIMATES (§4.6). The shell drives two customers through the fixed shell —
// customer 1 fully (entrance → conversation → crafting → handover), then customer
// 2 — and delivers each customer's outcome on the channel data assigns it:
//   • customer 1 → 재방문: a DELAYED result-arrival notification that fires the
//     instant customer 2's conversation begins (the signature overlap).
//   • customer 2 → 문앞 쪽지: the end screen.
//
// The overlap is deterministic, driven by the u2 predicate `isOutcomeDue(...)`
// evaluated on the two machines' phases — NOT a wall-clock timer. The only
// timers in this module are animation-cleanup fallbacks; they never gate the
// overlap trigger.
import './app.css';

import {
  createMachine,
  reduce,
  isOutcomePending,
  isOutcomeDue,
  type MachineState,
} from '../state/index.ts';
import { loadCustomers, loadIngredients, loadOutcomes } from '../data/loader.ts';
import type { Customer, Ingredient, Outcome, OutcomeTables } from '../data/schema.ts';
import { mountConversation } from '../screens/conversation/conversation.ts';
import { mountCrafting } from '../screens/crafting/index.ts';
import { renderEntrance } from './entrance.ts';
import { mountRevisitNotification } from '../screens/outcome/revisit.ts';
import { renderDoorNote } from '../screens/outcome/note.ts';

import customersData from '../../data/customers.json';
import ingredientsData from '../../data/ingredients.json';
import outcomesData from '../../data/outcomes.json';

/** Fallback so a missed animationend never strands an exiting screen on stage. */
const EXIT_FALLBACK_MS = 500;

/** Optional test hook the e2e gate reads to assert machine phases deterministically. */
interface AppTestApi {
  readonly customer1Phase: string;
  readonly customer2Phase: string;
  readonly customer1OutcomeDelivered: boolean;
}

export function mountApp(container: HTMLElement): void {
  // ── Data (build-time imports; no runtime fetch — §4.2) ──────────────────
  const customers: Customer[] = loadCustomers(customersData);
  const ingredients: Ingredient[] = loadIngredients(ingredientsData);
  const outcomes: OutcomeTables = loadOutcomes(outcomesData);

  const [c1, c2] = customers;
  if (!c1 || !c2) {
    throw new Error('app shell requires exactly two customers in data/customers.json');
  }

  // ── Two independent phase machines (u2). Reassigned on each transition; the
  // getters below always read the live binding. ──────────────────────────────
  let m1: MachineState = createMachine(c1.patienceBudget);
  let m2: MachineState = createMachine(c2.patienceBudget);
  let c1Outcome: Outcome | null = null;
  let c2Outcome: Outcome | null = null;

  // ── DOM scaffold ─────────────────────────────────────────────────────────
  const root = document.createElement('main');
  root.className = 'apothecary-app';
  const stage = document.createElement('div');
  stage.className = 'stage';
  stage.dataset.testid = 'stage';
  // The overlay layer floats the 재방문 notification ABOVE the live customer-2
  // conversation — that spatial overlap IS the mechanic (§1.4).
  const overlayLayer = document.createElement('div');
  overlayLayer.className = 'overlay-layer';
  overlayLayer.dataset.testid = 'overlay-layer';
  root.append(stage, overlayLayer);
  container.replaceChildren(root);

  // Expose a read-only test hook (mirrors the crafting harness's window.__crafting).
  const api: AppTestApi = {
    get customer1Phase() {
      return m1.phase;
    },
    get customer2Phase() {
      return m2.phase;
    },
    get customer1OutcomeDelivered() {
      return m1.phase === 'outcome';
    },
  };
  (window as unknown as { __app: AppTestApi }).__app = api;

  /**
   * Swap the stage to a fresh phase screen, animating the old one out and the
   * new one in (§4.6 — never an instant swap). Returns the new wrapper so the
   * caller can mount a screen into it.
   */
  function swapPhase(customerId: string, phase: string): HTMLElement {
    const outgoing = stage.firstElementChild as HTMLElement | null;
    if (outgoing) {
      outgoing.classList.remove('phase-enter');
      outgoing.classList.add('phase-exit');
      const drop = (): void => outgoing.remove();
      outgoing.addEventListener('animationend', drop, { once: true });
      window.setTimeout(drop, EXIT_FALLBACK_MS);
    }
    const wrapper = document.createElement('section');
    wrapper.className = 'phase phase-enter';
    wrapper.dataset.customer = customerId;
    wrapper.dataset.phase = phase;
    wrapper.dataset.testid = `phase-${customerId}-${phase}`;
    stage.appendChild(wrapper);
    return wrapper;
  }

  // ── Customer 1 track ───────────────────────────────────────────────────────
  function startCustomer1Entrance(): void {
    const wrapper = swapPhase(c1.id, 'entrance');
    renderEntrance(wrapper, c1, () => {
      m1 = reduce(m1, { type: 'advance' }); // entrance → conversation
      startCustomer1Conversation();
    });
  }

  function startCustomer1Conversation(): void {
    const wrapper = swapPhase(c1.id, 'conversation');
    let advanced = false;
    const toCrafting = (): void => {
      if (advanced) return; // onComplete and onPhaseChange are mutually exclusive, but guard anyway
      advanced = true;
      // Normal path leaves the app machine in 'conversation'; the forced path
      // (patience→0) does too, since the conversation screen owns its OWN machine.
      // Either way the app advances conversation → crafting via the canonical event.
      m1 = reduce(m1, { type: 'proceedToCrafting' });
      startCustomer1Crafting();
    };
    mountConversation(wrapper, c1, {
      onComplete: toCrafting,
      onPhaseChange: toCrafting, // forced-crafting (patience reached zero)
    });
  }

  function startCustomer1Crafting(): void {
    const wrapper = swapPhase(c1.id, 'crafting');
    mountCrafting(wrapper, {
      ingredients,
      customerId: c1.id,
      outcomeTable: outcomes[c1.id],
      onCommit: (result) => {
        // Persist customer 1's resolved outcome and commit — but DELAY delivery:
        // m1 parks at 'handover' (isOutcomePending === true) while customer 2's
        // visit begins. The overlap predicate decides when it is finally due.
        c1Outcome = result.outcome;
        m1 = reduce(m1, { type: 'commit' }); // crafting → handover
        startCustomer2Entrance();
      },
    });
  }

  // ── Customer 2 track ───────────────────────────────────────────────────────
  function startCustomer2Entrance(): void {
    const wrapper = swapPhase(c2.id, 'entrance');
    renderEntrance(wrapper, c2, () => {
      m2 = reduce(m2, { type: 'advance' }); // entrance → conversation
      startCustomer2Conversation();
    });
  }

  function startCustomer2Conversation(): void {
    const wrapper = swapPhase(c2.id, 'conversation');
    mountConversation(wrapper, c2, {
      onComplete: startCustomer2Crafting,
      onPhaseChange: startCustomer2Crafting,
    });
    // ── SIGNATURE OVERLAP (§1.4) ──────────────────────────────────────────
    // The instant customer 2's conversation begins, ask the u2 predicate whether
    // customer 1's delayed outcome is now due. This is level-triggered on the two
    // machines' phases — deterministic, NO timer. Same phases ⇒ same answer.
    maybeDeliverCustomer1Outcome();
  }

  function maybeDeliverCustomer1Outcome(): void {
    const due = isOutcomeDue({
      customer1OutcomePending: isOutcomePending(m1), // m1 at 'handover' ⇒ true
      customer2Phase: m2.phase, // '>= conversation' ⇒ has begun
    });
    if (!due || !c1Outcome) return;
    m1 = reduce(m1, { type: 'deliverOutcome' }); // handover → outcome
    // 재방문 channel: the delayed result arrives over the live c2 conversation.
    mountRevisitNotification(overlayLayer, { customer: c1, outcome: c1Outcome });
  }

  function startCustomer2Crafting(): void {
    const wrapper = swapPhase(c2.id, 'crafting');
    mountCrafting(wrapper, {
      ingredients,
      customerId: c2.id,
      outcomeTable: outcomes[c2.id],
      onCommit: (result) => {
        c2Outcome = result.outcome;
        m2 = reduce(m2, { type: 'commit' }); // crafting → handover
        // Customer 2's outcome is NOT delayed — deliver it straight to the end screen.
        m2 = reduce(m2, { type: 'deliverOutcome' }); // handover → outcome
        startCustomer2Outcome();
      },
    });
  }

  function startCustomer2Outcome(): void {
    if (!c2Outcome) return;
    const wrapper = swapPhase(c2.id, 'outcome');
    // 문앞 쪽지 channel: the end screen.
    renderDoorNote(wrapper, { customer: c2, outcome: c2Outcome });
  }

  // Kick off the sequence.
  startCustomer1Entrance();
}
