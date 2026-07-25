// Standalone harness entry for the conversation screen (design D10). Drives the
// real screen in a browser off the shipped content, so the e2e gate exercises
// the same data-driven path judges will — the customer slice is imported at
// build time (no runtime fetch), keeping the screen fully offline (AC9).
//
// u10: the screen is driven by an AI ADAPTER here, not by the seeded data slice
// alone. The stub adapter is the honest stand-in for the app shell's boot
// decision — it answers from canned data through the same seam and the same
// contract validators as the live proxy, with simulated latency zeroed so the
// gate never waits on a fake clock. `__onCompleteCount` stands in for the host's
// conversation→crafting handoff so the craft card's early exit is observable.
import { createStubAdapter } from '../../../src/ai/stub.ts';
import { loadCustomers } from '../../../src/data/loader.ts';
import { mountConversation } from '../../../src/screens/conversation/conversation.ts';
import customersData from '../../../data/customers.json';

interface HarnessHooks {
  __onCompleteCount?: number;
}

const hooks = window as unknown as HarnessHooks;
hooks.__onCompleteCount = 0;

/**
 * u11 harness knob (design D7): `?customer=<id>` picks which shipped customer is
 * mounted and `?budget=<n>` overrides that customer's patience budget, so the
 * tier ladder can be driven end to end WITHOUT editing data/customers.json (a
 * content file other specs pin). Both are harness-boundary substitutions —
 * absent or unusable params leave the default mount byte-identical.
 */
function pickCustomer<T extends { id: string; patienceBudget: number }>(
  customers: readonly T[],
  search: string,
): T | undefined {
  const params = new URLSearchParams(search);
  const wanted = params.get('customer');
  const chosen = customers.find((customer) => customer.id === wanted) ?? customers[0];
  if (chosen === undefined) return undefined;
  const budget = Number(params.get('budget'));
  if (!Number.isInteger(budget) || budget <= 0) return chosen;
  return { ...chosen, patienceBudget: budget };
}

const app = document.getElementById('app');
if (app) {
  const customers = loadCustomers(customersData);
  const first = pickCustomer(customers, window.location.search);
  if (first) {
    mountConversation(
      app,
      first,
      {
        onComplete: () => {
          hooks.__onCompleteCount = (hooks.__onCompleteCount ?? 0) + 1;
        },
      },
      { adapter: createStubAdapter({ latencyMs: { dialogueMs: 0, portraitMs: 0 } }) },
    );
  }
}
