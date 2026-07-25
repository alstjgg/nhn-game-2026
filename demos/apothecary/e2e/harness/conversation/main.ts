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

const app = document.getElementById('app');
if (app) {
  const customers = loadCustomers(customersData);
  const first = customers[0];
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
