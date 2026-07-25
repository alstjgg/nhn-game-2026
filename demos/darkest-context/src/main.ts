// Single-page entry. It renders the shell and stops there: screens reach the
// boot slot through the shell registry (src/app/shell.ts), so a screen unit
// never has to edit this file.
import './styles/base.css';
import { mountShell } from './app/shell.ts';

const root = document.getElementById('app');
if (root) {
  mountShell(root);
}
