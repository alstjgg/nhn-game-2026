// AI dev-proxy — Vite dev-middleware plugin (PRD §2.1). Thin transport wrapper
// around server/handlers.mjs, which owns prompt composition and vendor calls
// (and is shared with the deployable standalone server, server/standalone.mjs).
//
// Endpoints (dev server only — `apply: 'serve'` means the production build and
// `vite preview` never carry these, so the deployed Pages demo is stub-mode by
// construction unless it is pointed at a hosted standalone server):
//   GET  /ai/health    → { ok, dialogue, portrait, models }
//   POST /ai/dialogue  → structured game state in, DialogueBeat JSON out (claude-sonnet-5)
//   POST /ai/portrait  → trait strings in, { b64 } 4x2 expression sheet out (gpt-image-1)

import { handleDialogue, handlePortrait, healthPayload, post, send } from './handlers.mjs';

export function aiProxy() {
  return {
    name: 'apothecary-ai-proxy',
    apply: 'serve', // dev server only — never part of the build output
    configureServer(server) {
      server.middlewares.use('/ai/health', (nodeReq, res) => send(res, 200, healthPayload()));
      server.middlewares.use('/ai/dialogue', post(handleDialogue));
      server.middlewares.use('/ai/portrait', post(handlePortrait));
    },
  };
}
