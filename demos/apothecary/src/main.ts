// Single-page entry. The u8 app shell owns #app: it sequences two customers
// through the five-phase FSM, wires the conversation/crafting screens, and
// delivers outcomes over their two channels (재방문 / 문앞 쪽지) with the
// signature overlap. No routing — phases are animated DOM states inside #app.
import { mountApp } from './app/index.ts';

const app = document.getElementById('app');
if (app) {
  mountApp(app);
}
