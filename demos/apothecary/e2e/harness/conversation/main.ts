// Standalone harness entry for the conversation screen (design D10). Drives the
// real screen in a browser off the shipped content, so the e2e gate exercises
// the same data-driven path judges will — the customer slice is imported at
// build time (no runtime fetch), keeping the screen fully offline (AC9).
import { loadCustomers } from '../../../src/data/loader.ts';
import { mountConversation } from '../../../src/screens/conversation/conversation.ts';
import customersData from '../../../data/customers.json';

const app = document.getElementById('app');
if (app) {
  const customers = loadCustomers(customersData);
  const first = customers[0];
  if (first) mountConversation(app, first);
}
