# E0-shape-revalidation — reachability audit (B1)

Run-sheet step 3 (plan §7.3) · instrument §5.2 B1 · paper, **zero calls** ·
filed with the suite per §8.4. Audited 2026-07-30 against
`planning/dday-poc/poc-terror/slice-terror.json`, the slice E0's gate is ported
from.

## 1. Can any upstream choice close this gate?

**No.** J1 is the slice's entry gate: `state_init.clock` is `09:40`, J1's `time`
is `09:40`, and its `recent_events` is `@boundary(canonical)` — a fixed payload,
not a state-dependent one. There are zero upstream nodes, so there is no flag,
threshold, or earlier branch that can make J1 unreachable or change what it
presents.

Consequence for E0 specifically: the isolated probe and a full run enter this
gate in **the same state**, so E0 carries none of the
isolation-passes / full-run-fails risk B1 exists to catch. That risk returns at
the first probe on a downstream gate — not at this one.

## 2. Variable qualification at graph level (spec §3.1 form)

B1 doubles as the **read** test's evidence source, and covers **write**
redundantly with stance coverage. What J1's stances write:

| Variable | Write (spec §3.1 test 1) | Read (test 2) | Verdict |
|---|---|---|---|
| `rapport` | all four stances — a −30 · b +20 · c −40 · d +5 | clamp (`rapport < 10` ⇒ `line_alive = false`) · J2 c `@if rapport >= 50` · gate `G1_회선` (`rapport >= 60`) | passes write + read; **visible** is §5.5's probe, still unowned |
| `flags.background_heard` | J1 d, J2-dead c | **nothing** | **fails test 2** |

Test 3 (**visible**) is out of scope for a paper instrument — it needs the
narration probe (§5.5), whose owner is unassigned (spec §3.1, §10).

## 3. Incidental finding — four write-only flags in the ported slice

Found while tracing reads, recorded here because §5.2 B1 says to record the
answer in the form §3.1 wants rather than let scenario authoring re-derive it:

| Flag | Written at | Read at |
|---|---|---|
| `flags.background_heard` | J1 d · J2-dead c | — |
| `flags.t1_clue` | J2 b | — |
| `flags.sign_clue` | J5 b | — |
| `flags.yoon_defensive` | J5 c | — |

Each fails spec §3.1's read test as the slice stands. Two cautions on reading
this: the slice is the **archived POC**, not the production engine, so this is
input to scenario authoring, not a bug report against current code; and a
write-only flag is not automatically waste — three of the four look like
authored-but-unspent hooks. The §3.1 rule is that they earn no engine slot until
something reads them.

Everything else in `state_init` is read somewhere: `j8b_enabled` is read by a
stance's `visible_if` rather than an edge predicate (J8 b, `flags.j8b_enabled &&
found_T1`) — worth noting because a `visible_if` read is easy to miss when
grepping for predicates, and missing it would have produced a false finding here.

## 4. Verdict

**Clean for E0.** Nothing gates J1; the probe's arms differ only in `BLOCKS`
(runner-verified); no upstream state is required. Step 3 is satisfied and the
call loop (step 4) is unblocked.
