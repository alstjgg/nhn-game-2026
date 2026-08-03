// Where the three prompt layers physically live.
//
// The split is an ownership statement, not filing convenience (call contracts
// §6, "Supplier per slot"):
//
//   system  — the default prompt. FLAW · INCIDENT · PRIORITY_LIST come from here.
//   user    — the per-call template, filled from datapack + engine state +
//             player blocks.
//   temperament — probe FIXTURES only. The production source of truth is
//             `data/scenario/<slug>/temperament.json` (its own schema); these
//             .md files are the prose stand-ins the mechanism program's D-TEMP
//             channel varies. When the composer learns to render
//             temperament.json into the slot, these should be generated from a
//             pack so probe and production cannot disagree.
//
// The system and user layers both belong to the proxy (physical architecture
// §3.10, decided 08-03): the client posts slot VALUES and the proxy renders both
// layers. Neither file ships to the browser, prompt wording changes without a
// Pages redeploy, and the renderers and output schemas live on the same side as
// the templates they serve.
//
// Node-side callers resolve paths through here so that moving a layer is one
// edit. The two roots are still named separately even though they now point at
// the same directory — they are two different owners' artifacts and the split
// has already moved once.
//
// `tools/` READING these files is a filesystem read from a sibling directory,
// not a module import: the tier boundary in physical §3.2 forbids importing the
// proxy, not reading its files. `proxy/tests/prompt-parity.test.ts` is what
// keeps the probe's rendering and the proxy's rendering from drifting.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PROXY_PROMPTS = join(REPO, 'proxy', 'prompts');

export const PROMPTS = {
  systemRoot: PROXY_PROMPTS,
  userRoot: PROXY_PROMPTS,
  temperamentRoot: join(REPO, 'tools', 'probe', 'fixtures', 'temperament'),
};
