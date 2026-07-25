// Standalone harness for the app shell's ASYNC GENERATION WIRING (design D10/D11).
//
// It mounts the REAL `mountApp()` — same roster, same screens, same transitions
// as `/` — but injects a SCRIPTED adapter and a ManualClock so generation delays
// and the waiting-beat deadline are authored by the test instead of raced against.
// Nothing here touches the network: `?mode=live` only changes which adapter the
// boot factory *picks* (and what it reports), never where its answers come from.
//
// ── Contract (read by e2e/generation.spec.ts) ────────────────────────────────
//   URL:   /e2e/harness/generation/index.html
//   Query: mode=live|stub          which adapter createBootAdapter must choose
//          dialogue=ready|hold     scripted state of the PREFETCHED dialogue seed
//          portrait=ready|hold     scripted state of the PREFETCHED portrait sheet
//          holdFor=<customerId>    whose prefetch the two above apply to
//                                  (default: the last roster entry)
//          deadline=<ms>           injected uniform per-slot deadline
//   Globals: window.__testClock  = ManualClock { advance, now, pending, scheduled }
//            window.__testScript = { held, calls, release('dialogue'|'portrait') }
//
// Two properties make the scripting honest:
//   • The app only ever calls the INJECTED adapter from the prefetch pipeline —
//     a mounted conversation replays its already-fetched seed and then plays its
//     authored deck — so holding a track can never freeze the customer on stage.
//   • Prefetches start strictly one slot at a time (customer N's conversation
//     starts customer N+1's), and each start makes exactly one dialogue call and
//     one portrait call. The Nth call of a track therefore belongs to roster slot
//     N+1, which is how a `PortraitRequest` (traits only, no customer identity)
//     is still attributable to a customer.
import { createBootAdapter } from '../../../src/ai/boot.ts';
import type { AIAdapter } from '../../../src/ai/adapter.ts';
import type {
  AIHealth,
  DialogueBeat,
  PortraitSheet,
} from '../../../src/ai/contract.ts';
import { loadCustomers } from '../../../src/data/loader.ts';
import type { Customer } from '../../../src/data/schema.ts';
import { createManualClock, type ManualClock } from '../../../src/pipeline/clock.ts';
import { toBeat } from '../../../src/screens/conversation/beats.ts';
import { mountApp } from '../../../src/app/index.ts';
import customersData from '../../../data/customers.json';
import fallbackNpcs from '../../../data/fallback-npcs.json';

type Track = 'dialogue' | 'portrait';
type TrackScript = 'ready' | 'hold';

/** A real 4×2 sheet, small enough to inline — stands in for a generated portrait. */
const SCRIPTED_SHEET_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAIAAAAt/+nTAAAARklEQVR42u3PQQ0AMAgEsMmZJpQgYprQNg3Hu0kN9NzqSIVeaEJHQEBAQEBAQEBAQGAfuB2p0AtNSEBAQEBAQEBAQEBgHfhR+2CIfAyeUAAAAABJRU5ErkJggg==';

interface ScriptApi {
  readonly held: { dialogue: boolean; portrait: boolean };
  readonly calls: { dialogue: number; portrait: number };
  release(track: Track): void;
}

const params = new URLSearchParams(window.location.search);
const wantsLive = params.get('mode') === 'live';
const scripts: Record<Track, TrackScript> = {
  dialogue: params.get('dialogue') === 'ready' ? 'ready' : 'hold',
  portrait: params.get('portrait') === 'ready' ? 'ready' : 'hold',
};

const roster: Customer[] = [...loadCustomers(customersData), ...loadCustomers([fallbackNpcs.customer])];
const holdFor = params.get('holdFor') ?? roster[roster.length - 1]?.id ?? '';

const clock: ManualClock = createManualClock();
const calls: { dialogue: number; portrait: number } = { dialogue: 0, portrait: 0 };
const held: { dialogue: boolean; portrait: boolean } = { dialogue: false, portrait: false };
const releasers: Record<Track, (() => void) | null> = { dialogue: null, portrait: null };

/** Slot the Nth call of a track belongs to: prefetching starts at slot 1. */
function subjectFor(callIndex: number): Customer | undefined {
  return roster[callIndex + 1];
}

/**
 * One scripted answer. A call for the targeted customer follows its track's
 * script; a call for any OTHER customer stays in flight for the rest of the run,
 * so a stray prefetch can never resolve behind a test's back and make an
 * assertion about the target ambiguous.
 */
function scripted<T>(track: Track, subject: Customer | undefined, make: (of: Customer) => T): Promise<T> {
  calls[track] += 1;
  if (subject === undefined || subject.id !== holdFor) {
    return new Promise<T>(() => undefined);
  }
  if (scripts[track] === 'ready') return Promise.resolve(make(subject));
  held[track] = true;
  return new Promise<T>((resolve) => {
    releasers[track] = (): void => {
      held[track] = false;
      resolve(make(subject));
    };
  });
}

/** A scripted seed is the target's own opening node — a valid beat by construction. */
function beatFor(customer: Customer): DialogueBeat {
  const opening = customer.dialogueNodes[0];
  if (opening === undefined) throw new Error(`harness: ${customer.id} has no dialogue node`);
  return toBeat(opening);
}

function sheetFor(customer: Customer): PortraitSheet {
  return { b64: SCRIPTED_SHEET_B64, prompt: `harness scripted sheet for ${customer.id}` };
}

const scriptedAdapter: AIAdapter = {
  mode: wantsLive ? 'live' : 'stub',
  dialogue: () => scripted('dialogue', subjectFor(calls.dialogue), beatFor),
  portrait: () => scripted('portrait', subjectFor(calls.portrait), sheetFor),
};

const okHealth: AIHealth = {
  ok: true,
  dialogue: true,
  portrait: true,
  models: { dialogue: 'harness', portrait: 'harness' },
};

const script: ScriptApi = {
  get held() {
    return { ...held };
  },
  get calls() {
    return { ...calls };
  },
  release(track: Track): void {
    releasers[track]?.();
  },
};

(window as unknown as { __testClock: ManualClock }).__testClock = clock;
(window as unknown as { __testScript: ScriptApi }).__testScript = script;

async function boot(container: HTMLElement): Promise<void> {
  // The scripted instance is what BOTH branches of the boot factory hand back,
  // so `?mode` decides the reported mode without changing where answers come
  // from — and a health-ok probe still costs zero network requests.
  const adapter = await createBootAdapter({
    probe: () => Promise.resolve(wantsLive ? okHealth : null),
    createLive: () => scriptedAdapter,
    createStub: () => scriptedAdapter,
  });
  const deadlineMs = Number(params.get('deadline'));
  mountApp(container, {
    adapter,
    clock,
    deadlineMs: Number.isFinite(deadlineMs) && deadlineMs > 0 ? deadlineMs : undefined,
  });
}

const app = document.getElementById('app');
if (app) {
  void boot(app);
}
