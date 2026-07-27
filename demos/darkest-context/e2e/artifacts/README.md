# `e2e/artifacts/` — the phase screenshot set

This directory is the **declared home** of the per-phase stills the ship gate
captures (PRD §7 deliverables). It is committed on purpose: a destination that
only exists as a side effect of a green run is a destination no reviewer can
find.

`e2e/full-run.spec.ts -g screenshots` rewrites the set on every run:

| file | phase |
| --- | --- |
| `01-stage.png` | 전진 / 분기 — the walk screen, held at the branch |
| `02-combat.png` | T1 전투 |
| `03-training.png` | 훈련장 — the T1 reward hand-out |
| `04-council.png` | T3a 퍼즐 회의, captured **with** the 「번역 렌즈」 hint on screen |
| `05-rest.png` | T6 휴식 |
| `06-end.png` | 종료 — `data-result="clear"` |

Every still is taken only after `[data-testid="app-shell"][data-settled="true"]`.
That wait is the whole point of the gate: apothecary DISCOVERY §2 records a suite
that was green while every screenshot caught a mid-cross-fade frame, and no
functional assertion can catch that — `toBeVisible()` is happy with an element at
`opacity: 0`. The stills are evidence of composition and legibility; they cannot
judge motion, which is why the juice pass is asserted separately.

The capture run deletes only `*.png` here, never this file. The stills themselves are
git-ignored: they are output, rewritten on every gate run, in the same register as
`dist/` and `test-results/`. Run the gate to produce them:

```bash
cd demos/darkest-context
npx playwright test e2e/full-run.spec.ts -g screenshots
```
