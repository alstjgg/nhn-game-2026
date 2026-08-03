# authoring/

Authoring-time preprocessing for scenario data. Owner: **민서 (data track)**.

This is the stage that turns a hand-written draft into a datapack the rest of
the repo can trust. It runs **before** anything else exists — before the engine,
before a TypeScript build, before a browser. That is the whole reason it is not
under `tools/`: `tools/` imports `src/` and executes the game's own code paths,
while nothing here may assume any of that exists.

Pipeline stages 1–2 of [plan-pipeline.md](../docs/plan-pipeline.md) §2.

| Script | Stage | Transformation |
|---|---|---|
| `compile-datapack.mjs` | 1 · Compile | draft (write-scenario §4 format) → `data/scenario/<slug>/` |
| `lint-datapack.mjs` | 2 · Lint | datapack → violation list ([contract](../docs/contract-datapack.md) §3) |
| `generate-datapack-types.mjs` | — | `data/scenario/_schema/*.schema.json` → `src/shared/datapack.ts` |

```bash
npm run datapack:compile -- <draft.md>
npm run datapack:lint -- data/scenario/<slug>
npm run datapack:check          # type drift; also runs inside `npm run check`
```

**The schemas are the law, the TypeScript is a transcription.** A TS type is
erased at runtime and cannot check JSON, and packs must be validated where no
engine and no TS build exist yet — which is exactly here. `datapack.ts` is
generated so the transcription cannot disagree with its source; `--check` exits
non-zero on drift and is wired into `npm run check` (physical architecture §3.1).

Zero dependencies, zero LLM calls. No model touches stage 1: pack sentences are
the player's mining vein, and a silent paraphrase would break key conditions
invisibly.
