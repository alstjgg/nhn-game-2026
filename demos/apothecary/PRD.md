# Apothecary Demo — PRD (UI/UX shell PoC)

> **Owner:** 민서 · **Stack:** Vite + TypeScript + DOM/CSS — **no game engine, no framework** ·
> **Location:** everything lives in `demos/apothecary/` (self-contained: own `package.json`,
> own `node_modules`, own tests). The repo root is not touched.
>
> This is the single PRD the super-pipeline harness builds from. Interface facts
> (build commands, output shape) are frozen in
> [`docs/handoffs/apothecary-demo-contract.md`](../../docs/handoffs/apothecary-demo-contract.md);
> game-concept background is [`docs/game-concept-apothecary.md`](../../docs/game-concept-apothecary.md)
> — **reference only**. Conflict order: contract → this PRD → concept doc.
> The concept doc describes the *full game*; nothing from it is in scope unless this PRD names it.

---

## 1. Role & scope

A **PoC of the UI/UX shell**: prove that agents can build a customer-facing scene loop that
*reads as a game, not a form*. The LLM is **stubbed by design** — all "AI output" is canned
JSON. AI capability is already validated elsewhere; re-proving it here is scope creep.

**Must prove (the whole spec):**

1. **Phase shell & transitions** — one customer cycle moves through five phases:
   `entrance → conversation → crafting → handover → (delayed) outcome`, with real animated
   transitions between phases. Instant DOM swaps are a review-reject.
2. **Card-feel interaction** — dialogue choices and ingredients are cards with distinct
   hover / press / selected states. If a screen reads as a form or a code listing, it fails.
3. **Animation vocabulary** — portrait enter/exit, dialogue text type-on, patience meter
   animating down per question, a weighted [건네기] commit beat (confirm → customer exits),
   and a result-arrival notification. CSS transitions/keyframes + TS orchestration only.
4. **Overlap rhythm** — customer 1's outcome arrives *while serving customer 2* (signature
   mechanic). Trigger is deterministic: it fires when customer 2's conversation phase begins
   — never a wall-clock timer.
5. **Data-driven everything** — customers, dialogue, ingredients, outcome lookup all load
   from JSON under `demos/apothecary/data/`. Swapping JSON changes the run with zero code
   edits. This is the proof that the LLM *slot* exists.

**Does NOT do:** real LLM/network calls (zero runtime network requests) · free-text input UI
anywhere (**membrane rule** — applies even to the stub) · content volume (exactly 2 customers) ·
mentor, codex, reputation, 단골 arcs · balance tuning · save/load · audio · routing (single
page; phases are DOM states) · touching repo root or the root Pages deploy.

## 2. Baked defaults (no open ❔ — agents cannot ask mid-run)

- **Vite `base: './'`** — dist must work under a Pages subpath (contract requirement).
- **Language:** all game text Korean. Code/identifiers English.
- **Patience:** numeric budget per customer (data-defined); each dialogue choice carries a
  cost; at 0 the game auto-advances to crafting. [관찰] costs 0 and reveals clue cards.
- **Crafting:** pick 1–3 ingredient cards + 1 method (우리기/달이기/빻기) + [정석]/[실험]
  toggle, then [건네기]. Outcome lookup key = sorted ingredient ids + method + declaration.
  Every customer defines a **required `default` outcome** — any unlisted combination resolves
  to it (the "weird brew" result). No combination may dead-end.
- **Outcome channels:** customer 1 → 재방문 (portrait returns), customer 2 → 문앞 쪽지
  (end screen). Outcome text ≤ 80 chars per channel.
- **Portraits:** placeholder art (generated or CSS). Every generated asset gets an
  `assets-manifest.json` entry at repo root — no exceptions.
- **TypeScript `strict: true`.** Playwright: chromium only, headless.

## 3. Data shapes (top level frozen; sub-structure is implementer's call)

| file | carries |
|---|---|
| `data/customers.json` | 2 customers: id, name, portrait ref, stated problem, patience budget, dialogue nodes (npc line, choice cards with patience cost, clue reveals), observation clues |
| `data/ingredients.json` | ~8 ingredients: id, name, property tags (display only in demo) |
| `data/outcomes.json` | per customer: lookup entries `{ingredients, method, declaration} → outcome`, plus required `default`; outcome = channel + text + arrival trigger |

A loader validates these at startup and fails loudly on shape errors (this is the seam a
future LLM proxy plugs into).

## 4. Invariants (review-blocking)

1. **Membrane** — no free-text input to anything, anywhere.
2. **No runtime network calls** — the built demo runs fully offline.
3. **No game engine / UI framework** — DOM + CSS + TS only.
4. **Balance-as-data** — patience costs, lookup tables, all tunables in `data/` JSON,
   never inline in logic.
5. **Cards, never forms** — no native `<select>`/`<input>` for game verbs.
6. **No instant phase swaps** — every phase change animates.
7. **Relative asset paths** — dist works under `…/nhn-game-2026/demos/apothecary/`.
8. **Root untouched** — nothing installed or modified outside `demos/apothecary/` except
   `assets-manifest.json` entries.

## 5. Verification seams

- **vitest** covers the phase state machine and data loader — pure logic, no DOM.
- **Playwright** is the honest "green" for UI: per-screen specs assert the page loads with
  no console errors, the phase is reachable by clicking, and its named animations/classes
  fire. Tests live in `demos/apothecary/tests/` (vitest) and `demos/apothecary/e2e/`.
- **Per-unit gate = that unit's own slice** (`npx vitest run tests/state/` ·
  `npx playwright test e2e/conversation.spec.ts`) — **never the whole suite**; the full-loop
  e2e stays red until the last unit and would deadlock earlier units.
- **Full-loop e2e** (final unit only): click through both customers end to end — serve
  customer 1, see their outcome arrive during customer 2's conversation, finish, reach the
  end screen — with zero console errors. Screenshot each phase to `e2e/artifacts/`.
- **Smoke definition** (from the contract): page loads, no console errors, root element renders.

## 6. Work-unit DAG (hint — decomposer refines)

| id | title | deps | complexity | own-slice gate |
|---|---|---|---|---|
| u1 | Scaffold (Vite+TS strict, `base:'./'`) + phase state machine + data loader/validation | — | standard | `vitest run tests/` + `npm run build` |
| u2 | Stub content: 2 customers, ingredients, outcome lookups (Korean text, per §2/§3) | u1 | standard | `vitest run tests/data/` |
| u3 | Conversation screen: portrait enter, type-on, choice cards, patience meter, [관찰] | u1,u2 | high | `playwright test e2e/conversation.spec.ts` |
| u4 | Crafting screen: ingredient cards, method + [정석]/[실험], [건네기] commit beat | u1,u2 | high | `playwright test e2e/crafting.spec.ts` |
| u5 | Outcome channels + overlap trigger + result-arrival notification | u3,u4 | high | `playwright test e2e/overlap.spec.ts` |
| u6 | Juice pass (transition polish per §1.3) + full-loop e2e + phase screenshots | u5 | standard | full `playwright test` + build |

## 7. Definition of done

`npm ci && npm run build` green inside `demos/apothecary/` · full Playwright suite green,
including the full-loop e2e with the overlap observed · dist opens correctly under a subpath
(`vite preview` smoke) · phase screenshots exist in `e2e/artifacts/` · every generated asset
manifested · `demos/apothecary/DISCOVERY.md` populated: spec gaps, UI-verification friction,
and pipeline gaps ("couldn't see what the agent built", "green but unplayable") — this log
is a first-class deliverable feeding the super-pipeline game-mod.
