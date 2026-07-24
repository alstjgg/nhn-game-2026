// Minimal single-page entry. Later units (phase shell, conversation, crafting,
// outcome) mount into #app; for the scaffold we just prove the page renders.
// u5 surfaces the shared card primitives here so the vocabulary is live at `/`.
import { mountCardShowcase } from './ui/showcase.ts';

const app = document.getElementById('app');

if (app) {
  app.innerHTML = `
    <main class="apothecary-shell">
      <h1>약방</h1>
      <p>Scaffold ready.</p>
    </main>
  `;
  // TODO(u3/u4): remove this showcase mount once a real conversation/crafting
  // screen renders domain cards at `/` — see DISCOVERY.md "Scope resolution".
  // This is a placeholder render surface for the card primitives, not the
  // intended demo home screen.
  mountCardShowcase(app);
}
