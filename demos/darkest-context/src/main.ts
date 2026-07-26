// Single-page entry. It is one call and nothing else: the shell, the screen registry,
// the adapter mode and the run all belong to `src/app/boot-app.ts` — a screen unit
// never has to edit this file, which is what u1's registry seam bought.
import './styles/base.css';
import { bootApp } from './app/boot-app.ts';
import { mountShell } from './app/shell.ts';

const root = document.getElementById('app');
if (root) {
  void bootApp({ slot: mountShell(root) });
}
