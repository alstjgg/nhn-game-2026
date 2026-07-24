// Minimal single-page entry. Later units (phase shell, conversation, crafting,
// outcome) mount into #app; for the scaffold we just prove the page renders.
const app = document.getElementById('app');

if (app) {
  app.innerHTML = `
    <main class="apothecary-shell">
      <h1>약방</h1>
      <p>Scaffold ready.</p>
    </main>
  `;
}
